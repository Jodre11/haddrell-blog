# Security Regression Guards — Design Spec

**Date:** 2026-05-05
**Owner:** Christian Haddrell
**Target areas:** repo settings (GitHub), `.github/workflows/`, `src/lib/`, `tests`

## 1. Goal

Prevent future PRs from silently re-introducing the kinds of issues a manual
`/security-review` would catch. The bar is "lean across all categories,
prioritise secrets" — not exhaustive coverage. Total cost: £0 (the repo is
public; all the GitHub-native security features that matter are free for
public repos).

## 2. Non-goals

- Not adding pre-commit hooks. GitHub push protection runs server-side and
  cannot be bypassed by `--no-verify`; pre-commit shifts secret detection
  earlier by ~2 seconds at the cost of repo install friction.
- Not running CodeQL on a schedule, nightly, or with custom queries — default
  PR + push triggers are enough.
- Not adding new CI pipelines. New checks fold into the existing `ci.yml`
  job or run inside `npm test` (vitest).
- Not changing the existing JSON-LD escape, sanitize-html allowlist, or
  `_headers` file. Those are already correct; this spec only adds guards
  that detect *future* regressions.
- Not catching every theoretically possible regression — only the high-value
  ones that fit the threat model in §3.

## 3. Threat model — what we're guarding against

| # | Regression | Today's defence | Failure mode if undefended |
|---|---|---|---|
| 1 | Secret committed to repo (`.env`, Cloudflare API token, GitHub PAT) | None on this repo | Token leaks; rotation cost + exposure window |
| 2 | New `set:html=` introduced in an `.astro` template without `serializeJsonLd` or sanitisation | None — relies on author/reviewer noticing | Stored XSS via post content |
| 3 | Existing JSON-LD escape regressed (e.g. someone "simplifies" `serializeJsonLd`) | Existing test in `src/lib/schema.test.ts` | Stored XSS via post content |
| 4 | `_headers` file edited to drop CSP / `X-Frame-Options` / `X-Content-Type-Options` / `Referrer-Policy` / `Permissions-Policy` | None — silent | Loss of defence-in-depth, framing/MIME-sniffing attacks |
| 5 | New JS/TS sink in `src/lib/**` or `src/pages/**/*.ts` (e.g. tainted `eval`, `innerHTML`, dangerous DOM-mutation APIs) | None | Various — XSS, code injection |
| 6 | New dependency with a known CVE merged via a contributor PR | Dependabot raises advisories *after* merge | Vulnerable dep on `main` until alert is resolved |
| 7 | New workflow file added that uses `pull_request_target` with a checkout of the PR head, or interpolates `${{ github.event.* }}` into a `run:` shell | None | CI compromise / token theft |

Items #1, #2, #4, #6, #7 are uncovered today. #3 is covered. #5 has partial
coverage via TypeScript and ESLint but not security-aware analysis.

## 4. Architecture

Six independent guards. None depend on each other; each can be added or
removed without affecting the others.

```
                 ┌─────────────────────────────────────┐
   git push ──── │ GitHub push protection (secrets)    │ ── G1
                 └─────────────────────────────────────┘
                                   │
                                   ▼
                 ┌─────────────────────────────────────┐
   git push ──── │ GitHub secret scanning (history)    │ ── G2
                 └─────────────────────────────────────┘

                 ┌─────────────────────────────────────┐
   PR opened ─── │ CodeQL workflow (JS/TS sinks)       │ ── G3
                 └─────────────────────────────────────┘

                 ┌─────────────────────────────────────┐
   PR opened ─── │ dependency-review-action (CI step)  │ ── G4
                 └─────────────────────────────────────┘

                 ┌─────────────────────────────────────┐
   npm test ──── │ vitest: _headers invariants         │ ── G5
                 └─────────────────────────────────────┘

                 ┌─────────────────────────────────────┐
   npm test ──── │ vitest: set:html allowlist          │ ── G6
                 └─────────────────────────────────────┘
```

### G1. GitHub push protection (secrets, real-time)

- **What:** Server-side scan at `git push` time. If a known secret pattern
  is detected (Cloudflare API token, GitHub PAT, AWS keys, generic
  high-entropy patterns, etc.), the push is rejected with a message and a
  bypass-or-confirm prompt.
- **Where:** Repo settings → Code security → Secret scanning → Push
  protection. No code change.
- **Threat coverage:** #1.
- **Bypass model:** Bypass requires an explicit reason and is logged in
  the security overview. Cannot be bypassed by `--no-verify`.

### G2. GitHub secret scanning (history, passive)

- **What:** Scans the entire repo history (and ongoing pushes) for the
  same secret patterns. Raises an alert on the Security tab. For a public
  repo, GitHub *also* notifies the relevant secret provider (e.g.
  Cloudflare) so the secret is automatically revoked.
- **Where:** Repo settings → Code security → Secret scanning. Already on
  by default for public repos; verify enabled and add no-op if not.
- **Threat coverage:** #1 (defence in depth — catches anything G1 missed
  or that pre-dates G1).

### G3. CodeQL workflow (generic JS/TS SAST)

- **What:** GitHub's CodeQL analysis on JS/TS files. Catches common sinks
  (`eval`, `innerHTML`, dangerous DOM-mutation APIs, untrusted regexes,
  prototype pollution patterns) using GitHub's `security-extended` query
  suite.
- **Where:** New workflow `.github/workflows/codeql.yml`, generated via
  `actions/checkout` + `github/codeql-action/init` + `analyze`. Runs on
  PR and push to `main`. No schedule trigger.
- **Triggers:** `push: [main]`, `pull_request:`. (No `pull_request_target`
  — see threat #7 reasoning in §6 below.)
- **Languages:** `javascript-typescript` (the unified pack — covers both).
- **Coverage gap:** CodeQL parses `.astro` frontmatter as JS/TS but does
  not analyse template-body directives (`set:html`, etc.). G6 fills this.
- **Threat coverage:** #5.
- **Result handling:** Findings appear in the Security tab → Code
  scanning. The workflow itself does not fail the build by default; PR
  reviewers see the findings inline as PR annotations. (We can flip the
  workflow to fail-on-error later if it ever produces a finding worth
  blocking on.)

### G4. dependency-review-action (PR gate)

- **What:** GitHub-published action (`actions/dependency-review-action`)
  that diffs the dependency tree between base and head of a PR and fails
  the build if any added/upgraded dep has a known CVE at or above a
  configured severity threshold.
- **Where:** New job in existing `.github/workflows/ci.yml`, gated on
  `pull_request` event. Runs in parallel with the existing `build` job.
- **Severity threshold:** `moderate`. Rationale: `low` is too noisy for
  a personal blog; `high`-only would let in `moderate`-rated XSS in dev
  dependencies. `moderate` is the project's effective bar for "do not
  merge without thinking."
- **Threat coverage:** #6.
- **Failure mode:** PR check fails. Author either upgrades, swaps, or
  documents an exception in the PR description.

### G5. `_headers` invariants test

- **What:** Vitest test that reads `public/_headers` and asserts the
  presence of:
  - A `Content-Security-Policy` header on the global `/*` route.
  - `X-Frame-Options: DENY` (or `SAMEORIGIN`).
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy` set to a value that is not `unsafe-url` or empty.
  - `Permissions-Policy` non-empty.
- **Where:** `src/lib/headers.test.ts`. Picked up by the existing
  `npm test` script (vitest).
- **Implementation note:** Parser is a simple line-by-line read of
  `public/_headers`. No parser library — the file format is trivial.
- **Threat coverage:** #4.
- **What it does *not* check:** the contents of the CSP itself (e.g. it
  does not assert that `'unsafe-inline'` stays out, because today it is
  *in*). The test is a regression net for *deletion*, not a tightening
  mechanism.

### G6. `set:html` allowlist test

- **What:** Vitest test that globs `src/**/*.astro`, finds every
  occurrence of `set:html=`, and asserts each one matches a small
  explicit allowlist of known-safe usages. Today's allowlist:
  - JSON-LD via `serializeJsonLd(...)` — used in `src/layouts/Post.astro`,
    `src/pages/about.astro`, and `src/pages/index.astro`. The escape
    helper has its own regression test (`src/lib/schema.test.ts`).
  - SVG inlined via `<Fragment set:html={sized} />` in
    `src/components/Dougal.astro` — `sized` is the project's own
    `dougal.svg` (imported via Astro's `?raw`), regex-modified to
    inject `width`/`height`/`class` from author-supplied props.
    Build-time only; the only caller (`Footer.astro`) passes
    `size={40}`. Safe because all inputs are author-controlled at
    build time and the source SVG is in-repo.
- **Where:** `src/lib/set-html-audit.test.ts`. Picked up by `npm test`.
- **How a contributor adds a new safe usage:** edit the allowlist
  constant in the test file. The test reads as documentation of "every
  place we deliberately emit raw HTML, and why."
- **Threat coverage:** #2.
- **Limit:** This is a *callsite* check, not a tainted-flow check. It
  guarantees that any new `set:html` is reviewed and added to an
  allowlist; it does not prove the value passed in is safe. That proof
  lives in the helper (e.g. `serializeJsonLd`'s own test).

## 5. Coverage matrix

| Threat # | Description | Guarded by |
|---|---|---|
| 1 | Secret committed | G1 + G2 |
| 2 | New unsafe `set:html` in `.astro` | G6 |
| 3 | JSON-LD escape regressed | existing `schema.test.ts` (unchanged) |
| 4 | `_headers` directive removed | G5 |
| 5 | JS/TS sink introduced in `.ts` | G3 |
| 6 | Vulnerable dep introduced via PR | G4 |
| 7 | Unsafe workflow added | **not guarded — see §6** |

## 6. Explicit gap: workflow-injection guard (#7)

A `pull_request_target` workflow that checks out the PR head + interpolates
untrusted PR fields into a `run:` shell is the textbook GitHub Actions
pwn pattern. We are *not* adding a guard for this in v1, because:

- The repo currently has zero `pull_request_target` workflows.
- All forks are blocked from running secrets-bearing jobs in
  `pull_request` (the GitHub default).
- Adding a guard means writing a custom CI step or YAML linter for our
  own workflow files, which is itself a maintenance surface.

If a future PR adds a `pull_request_target` workflow, the PR review
itself is the guard. If that ever happens twice, revisit and add a
`actionlint` step to CI.

## 7. What gets added (file-level summary)

| File | Action | Lines (approx.) |
|---|---|---|
| Repo settings (no file) | Enable G1, verify G2 | n/a |
| `.github/workflows/codeql.yml` | New (G3) | ~30 |
| `.github/workflows/ci.yml` | Add `dependency-review` job (G4) | +12 |
| `src/lib/headers.test.ts` | New (G5) | ~40 |
| `src/lib/set-html-audit.test.ts` | New (G6) | ~30 |
| `docs/superpowers/specs/2026-05-05-security-regression-guards-design.md` | This file | — |

Total new code: ~110 lines. No new dependencies (all guards use already-
installed `vitest` or GitHub-published actions).

## 8. Testing the guards themselves

The vitest guards (G5, G6) are tests, so they test themselves in the
sense that a regression in the *guarded* file makes the test fail. To
validate they work:

- **G5:** delete a header from `public/_headers` on a scratch branch,
  run `npm test`, observe failure, revert.
- **G6:** add a `set:html={something}` to a test `.astro` file on a
  scratch branch, run `npm test`, observe failure, revert.

For G3 and G4, validation is "the workflow runs green on a PR with no
issues; the workflow fails on a PR that introduces a known-vulnerable
dep or an obvious sink." We will not deliberately introduce a
vulnerable dep to test G4 — instead we trust the action's published
behaviour and rely on the first real Dependabot PR to confirm.

For G1, validation is to attempt to push a fake `GITHUB_PAT=ghp_...`
test string to a branch; expect rejection.

## 9. Risks & mitigations

- **Risk: G6 produces false positives** for a legitimate new `set:html`
  usage and slows down a PR.
  **Mitigation:** the allowlist is in-repo and easy to extend in the
  same PR. Friction is intentional — every new `set:html` should be a
  conscious decision.

- **Risk: CodeQL produces noisy findings** that reviewers ignore.
  **Mitigation:** keep `security-extended` (not `security-and-quality`).
  Re-evaluate after the first findings appear; consider muting specific
  rules via `paths-ignore` or per-rule `dismissed` reasons.

- **Risk: dependency-review-action blocks a Dependabot upgrade** that
  itself fixes a different vuln.
  **Mitigation:** the action's failure is informational — author can
  override in the PR description if the upgrade strictly improves
  posture. Severity threshold of `moderate` (not `low`) reduces this.

- **Risk: secret scanning flags a token in the existing history.**
  **Mitigation:** if it does, that's a real finding — rotate and use
  GitHub's "revoke" path. This is desired behaviour, not a risk.

## 10. Out of scope (YAGNI)

- `actionlint` / workflow security linter — not enough workflows.
- `osv-scanner` — overlaps with G4 + Dependabot.
- `gitleaks` — overlaps with G1 + G2.
- Custom CodeQL queries for Astro `set:html` — G6 covers this more
  cheaply.
- A schedule trigger on CodeQL — PR + push is enough; the codebase
  doesn't churn fast enough to need nightly re-scans of unchanged code.
- Tightening CSP to remove `'unsafe-inline'` — separate piece of work
  with its own design considerations (would require refactoring inline
  scripts in `BaseHead.astro`).
