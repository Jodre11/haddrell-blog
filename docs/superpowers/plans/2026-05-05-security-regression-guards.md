# Security Regression Guards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six independent security regression guards (G1–G6) to the public Astro blog repo so future PRs can't silently re-introduce the kinds of issues a manual `/security-review` would catch.

**Architecture:** Two GitHub-native guards (push protection + secret scanning) enabled via `gh api`, two CI workflow guards (CodeQL + dependency-review-action), two repo-local vitest invariant tests (`_headers` + `set:html` allowlist). Every guard is independent; the sequence below lands quick wins first and spreads CI churn across phases.

**Tech Stack:** GitHub Actions, GitHub Advanced Security (free for public repos), vitest 4.x, Node 22, TypeScript.

**Spec reference:** `docs/superpowers/specs/2026-05-05-security-regression-guards-design.md`

**Branch convention:** all work on a single feature branch `security/regression-guards`; squash-merged via PR (per the repo's squash-only merge policy).

---

## Phase 0 — Branch & spec

### Task 1: Create feature branch and commit the spec + plan

**Files:**
- Modify: working tree (branch)
- Create: (already on disk) `docs/superpowers/specs/2026-05-05-security-regression-guards-design.md`
- Create: (already on disk) `docs/superpowers/plans/2026-05-05-security-regression-guards.md`

- [ ] **Step 1: Confirm working tree state on main**

```
git status
```

Expected: `On branch main`. The spec file `docs/superpowers/specs/2026-05-05-security-regression-guards-design.md` should appear under "Untracked files" — it is on disk but not yet committed. No other untracked or modified files should be present; if there are, stop and ask the user.

- [ ] **Step 2: Pull latest main**

```
git fetch origin main
git checkout main
git merge --ff-only origin/main
```

- [ ] **Step 3: Create the feature branch**

```
git checkout -b security/regression-guards
```

- [ ] **Step 4: Stage and commit the spec + plan**

```
git add docs/superpowers/specs/2026-05-05-security-regression-guards-design.md docs/superpowers/plans/2026-05-05-security-regression-guards.md
git commit -m "Add security regression guards design spec and plan"
```

---

## Phase 1 — Repo settings (G1, G2)

### Task 2: Enable secret scanning + push protection via `gh api`

**Files:** none (GitHub API call only).

**Why this is in the plan even though no code changes:** the PR description should record the before/after state of `security_and_analysis` so future maintainers can see when each control was turned on. The `gh api` calls are idempotent — running them on an already-enabled setting is a no-op.

- [ ] **Step 1: Capture current state**

```
gh api /repos/Jodre11/haddrell-blog --jq '.security_and_analysis'
```

Expected: a JSON object. For a public repo, `secret_scanning.status` should already be `"enabled"`. `secret_scanning_push_protection.status` may be `"enabled"` or `"disabled"`. Save the output — paste it into the PR description under "Before".

- [ ] **Step 2: Enable secret scanning (idempotent)**

```
gh api -X PATCH /repos/Jodre11/haddrell-blog -F 'security_and_analysis[secret_scanning][status]=enabled'
```

Expected: HTTP 200 with the updated repo object. If GitHub returns `422` saying "secret scanning is already enabled and cannot be modified", that's fine — public repos always have it on.

- [ ] **Step 3: Enable push protection (idempotent)**

```
gh api -X PATCH /repos/Jodre11/haddrell-blog -F 'security_and_analysis[secret_scanning_push_protection][status]=enabled'
```

Expected: HTTP 200. If push protection was already on, this is a no-op.

- [ ] **Step 4: Re-capture state and confirm**

```
gh api /repos/Jodre11/haddrell-blog --jq '.security_and_analysis'
```

Expected: both `secret_scanning.status` and `secret_scanning_push_protection.status` are `"enabled"`. Save this output for the PR description "After" block.

- [ ] **Step 5: Smoke-test push protection (optional but recommended)**

Create a scratch file containing a fake-but-realistic-looking GitHub PAT pattern, attempt to push it, observe rejection, then delete the scratch commit. Skip if you don't want to clutter the reflog.

```
git checkout -b scratch/push-protection-test
printf 'token: ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n' > scratch.txt
git add scratch.txt
git commit -m "Scratch: push protection smoke test"
git push -u origin scratch/push-protection-test
```

Expected: `git push` is rejected with a "GH013: Repository rule violations found" error mentioning a generic API token / GitHub Personal Access Token. Then clean up:

```
git checkout security/regression-guards
git branch -D scratch/push-protection-test
rm -f scratch.txt
```

- [ ] **Step 6: Note the result in the PR description draft**

Keep a running scratch file at `/tmp/claude-fd84c4c2-76f5-4079-ba7f-2ab05ee557d5/pr-description.md` capturing before/after settings JSON, to paste into the PR body in Task 7.

No commit — this task does not change any tracked file.

---

## Phase 2 — Vitest invariants (G5, G6)

### Task 3: G5 — `_headers` security invariants test

**Files:**
- Create: `src/lib/headers.test.ts`
- Read for context: `public/_headers`, `src/lib/schema.test.ts`

**Style notes (match existing tests):** 4-space indent, single quotes, `import { describe, expect, test } from 'vitest'`, `test(...)` (not `it(...)`).

- [ ] **Step 1: Read the existing test for style reference**

Use the Read tool on `src/lib/schema.test.ts`. Confirm the import style (`import { describe, expect, test } from 'vitest';`), 4-space indent, and single-quote string convention. The new test file uses the same conventions.

- [ ] **Step 2: Write the failing test**

Create `src/lib/headers.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HEADERS_PATH = fileURLToPath(new URL('../../public/_headers', import.meta.url));

// Parse a Cloudflare _headers file and return the headers applied to a given route.
// Routes are unindented lines; headers are indented lines until the next blank line
// or the next unindented line.
function headersForRoute(content: string, route: string): Map<string, string> {
    const headers = new Map<string, string>();
    const lines = content.split(/\r?\n/);
    let inRoute = false;

    for (const line of lines) {
        const isIndented = /^\s+\S/.test(line);
        const isBlank = line.trim().length === 0;

        if (!isIndented && !isBlank) {
            inRoute = line.trim() === route;
            continue;
        }
        if (!inRoute) continue;
        if (isBlank) {
            inRoute = false;
            continue;
        }

        const trimmed = line.trim();
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) continue;
        const name = trimmed.slice(0, colonIndex).trim().toLowerCase();
        const value = trimmed.slice(colonIndex + 1).trim();
        headers.set(name, value);
    }

    return headers;
}

describe('public/_headers — security invariants for /*', () => {
    const content = readFileSync(HEADERS_PATH, 'utf-8');
    const headers = headersForRoute(content, '/*');

    test('Content-Security-Policy is set', () => {
        expect(headers.get('content-security-policy')).toBeTruthy();
    });

    test('X-Frame-Options is DENY or SAMEORIGIN', () => {
        const value = headers.get('x-frame-options');
        expect(value).toBeTruthy();
        expect(value!.toUpperCase()).toMatch(/^(DENY|SAMEORIGIN)$/);
    });

    test('X-Content-Type-Options is nosniff', () => {
        expect(headers.get('x-content-type-options')?.toLowerCase()).toBe('nosniff');
    });

    test('Referrer-Policy is set and not unsafe-url', () => {
        const value = headers.get('referrer-policy');
        expect(value).toBeTruthy();
        expect(value!.toLowerCase()).not.toBe('unsafe-url');
    });

    test('Permissions-Policy is non-empty', () => {
        expect(headers.get('permissions-policy')).toBeTruthy();
    });
});
```

- [ ] **Step 3: Run the test — expect PASS**

```
npm test -- src/lib/headers.test.ts
```

Expected: 5 tests pass. (This is a regression test for already-correct behaviour, so green-on-first-run is expected.)

- [ ] **Step 4: Prove the test fails on a regression**

Temporarily delete the `X-Frame-Options: DENY` line from `public/_headers` (use the Edit tool — `_headers` is a tracked file, so the change can be reverted with `git checkout --`). Then re-run the test, observe failure, then revert.

```
npm test -- src/lib/headers.test.ts
```

Expected: the `X-Frame-Options is DENY or SAMEORIGIN` test fails with `expected undefined to be truthy`. Now restore the file:

```
git checkout -- public/_headers
```

Re-run:

```
npm test -- src/lib/headers.test.ts
```

Expected: all 5 tests pass again.

- [ ] **Step 5: Lint & typecheck**

```
npm run lint
npm run check
```

Expected: clean.

- [ ] **Step 6: Commit**

```
git add src/lib/headers.test.ts
git commit -m "Add _headers security invariants regression test"
```

---

### Task 4: G6 — `set:html` allowlist test

**Files:**
- Create: `src/lib/set-html-audit.test.ts`

**Why a callsite check, not a tainted-flow check:** see spec §4 G6. We are forcing every `set:html` to be a deliberate, allowlisted decision; per-callsite *value* safety lives in the helper that builds the value (e.g. `serializeJsonLd`'s own test).

- [ ] **Step 1: Confirm current `set:html` callsites**

```
grep -rn 'set:html' src/
```

Expected: four hits across three patterns:
1. `src/layouts/Post.astro` — `set:html={schemaJson}` (JSON-LD)
2. `src/pages/about.astro` — `set:html={schemaJson}` (JSON-LD)
3. `src/pages/index.astro` — `set:html={schemaJson}` (JSON-LD)
4. `src/components/Dougal.astro` — `set:html={sized}` (build-time SVG inlining)

If you see more or fewer than these four, STOP and report — the controller will need to expand the allowlist with new `reason` strings.

- [ ] **Step 2: Write the failing test**

Create `src/lib/set-html-audit.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SRC_ROOT = join(PROJECT_ROOT, 'src');

// Every place we deliberately emit raw HTML, and why it is safe.
// To add a new entry: confirm the value passed to set:html is escaped/sanitised
// at its source (and ideally has its own regression test there).
const ALLOWLIST: ReadonlyArray<{ file: string; match: string; reason: string }> = [
    {
        file: 'src/layouts/Post.astro',
        match: 'set:html={schemaJson}',
        reason: 'JSON-LD via serializeJsonLd — escapes < and / before injection (see schema.test.ts)',
    },
    {
        file: 'src/pages/about.astro',
        match: 'set:html={schemaJson}',
        reason: 'JSON-LD via serializeJsonLd — escapes < and / before injection (see schema.test.ts)',
    },
    {
        file: 'src/pages/index.astro',
        match: 'set:html={schemaJson}',
        reason: 'JSON-LD via serializeJsonLd — escapes < and / before injection (see schema.test.ts)',
    },
    {
        file: 'src/components/Dougal.astro',
        match: 'set:html={sized}',
        reason: 'In-repo dougal.svg imported via ?raw, regex-modified with author-controlled build-time props (size, className) — no runtime user input',
    },
];

function walkAstroFiles(root: string): string[] {
    const results: string[] = [];
    function walk(dir: string) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.name.endsWith('.astro')) {
                results.push(relative(root, fullPath));
            }
        }
    }
    walk(root);
    return results;
}

describe('set:html callsite audit', () => {
    test('every set:html occurrence in src/**/*.astro is on the allowlist', () => {
        const findings: { file: string; match: string }[] = [];

        for (const relativePath of walkAstroFiles(SRC_ROOT)) {
            const fullPath = join(SRC_ROOT, relativePath);
            const content = readFileSync(fullPath, 'utf-8');
            const matches = content.matchAll(/\bset:html=\{[^}]+\}/g);
            const filePath = `src/${relativePath.replace(/\\/g, '/')}`;

            for (const m of matches) {
                const isAllowed = ALLOWLIST.some(
                    (entry) => entry.file === filePath && entry.match === m[0],
                );
                if (!isAllowed) {
                    findings.push({ file: filePath, match: m[0] });
                }
            }
        }

        expect(findings).toEqual([]);
    });
});
```

- [ ] **Step 3: Run the test — expect PASS**

```
npm test -- src/lib/set-html-audit.test.ts
```

Expected: 1 test passes.

- [ ] **Step 4: Prove the test fails on a regression**

Use the Edit tool to append a fake unsafe usage to `src/components/Footer.astro` (anywhere inside the template body — `Footer.astro` is a tracked file, so the edit can be reverted with `git checkout --`):

```astro
<div set:html={someUnsafeValue}></div>
```

Run:

```
npm test -- src/lib/set-html-audit.test.ts
```

Expected: failure. The `findings` array contains `{ file: 'src/components/Footer.astro', match: 'set:html={someUnsafeValue}' }`. Restore the file:

```
git checkout -- src/components/Footer.astro
```

Re-run:

```
npm test -- src/lib/set-html-audit.test.ts
```

Expected: pass.

- [ ] **Step 5: Lint & typecheck**

```
npm run lint
npm run check
```

Expected: clean.

- [ ] **Step 6: Commit**

```
git add src/lib/set-html-audit.test.ts
git commit -m "Add set:html callsite allowlist test"
```

---

## Phase 3 — Dependency review (G4)

### Task 5: Add `dependency-review` job to existing CI workflow

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Read current `ci.yml`**

Use the Read tool on `.github/workflows/ci.yml`. Confirm the file has the structure shown in spec §4 G4: a single `build` job. The new `dependency-review` job goes alongside it.

- [ ] **Step 2: Add the new job**

Append the `dependency-review` job to `.github/workflows/ci.yml`. The full file becomes:

```yaml
name: CI

on:
    push:
        branches: [main]
    pull_request:

jobs:
    build:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v6
            - uses: actions/setup-node@v6
              with:
                  node-version: '22'
                  cache: npm
            - run: npm ci
            - run: npm run lint
            - run: npm run check
            - run: npm test
            - run: npm run build

    dependency-review:
        if: github.event_name == 'pull_request'
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v6
            - uses: actions/dependency-review-action@v4
              with:
                  fail-on-severity: moderate
```

- [ ] **Step 3: Validate YAML locally**

If `actionlint` is installed (`brew install actionlint`), run:

```
actionlint .github/workflows/ci.yml
```

Expected: no errors. If `actionlint` is not installed, skip — GitHub will validate on push.

- [ ] **Step 4: Commit**

```
git add .github/workflows/ci.yml
git commit -m "Add dependency-review-action job to CI for PR vuln gating"
```

---

## Phase 4 — CodeQL (G3)

### Task 6: Add CodeQL workflow

**Files:**
- Create: `.github/workflows/codeql.yml`

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/codeql.yml`:

```yaml
name: CodeQL

on:
    push:
        branches: [main]
    pull_request:

jobs:
    analyze:
        runs-on: ubuntu-latest
        permissions:
            actions: read
            contents: read
            security-events: write
        steps:
            - uses: actions/checkout@v6
            - uses: github/codeql-action/init@v3
              with:
                  languages: javascript-typescript
                  queries: security-extended
            - uses: github/codeql-action/analyze@v3
              with:
                  category: '/language:javascript-typescript'
```

- [ ] **Step 2: Validate YAML locally (if actionlint available)**

```
actionlint .github/workflows/codeql.yml
```

Expected: no errors.

- [ ] **Step 3: Commit**

```
git add .github/workflows/codeql.yml
git commit -m "Add CodeQL workflow for JS/TS security analysis"
```

---

## Phase 5 — Open the PR

### Task 7: Push branch and open PR

**Files:** none locally; PR draft is composed from the running notes in `/tmp/claude-fd84c4c2-76f5-4079-ba7f-2ab05ee557d5/pr-description.md`.

- [ ] **Step 1: Push the branch**

```
git push -u origin security/regression-guards
```

- [ ] **Step 2: Compose PR description**

Write to `/tmp/claude-fd84c4c2-76f5-4079-ba7f-2ab05ee557d5/pr-body.md` — include:

- One-paragraph context (links spec doc, explains the lean-but-broad coverage stance).
- A list of the six guards (G1–G6) with one-line summaries each.
- Before/after `security_and_analysis` JSON from Task 2.
- A note that GHAS-native features (G1–G3) require no review — they're enabled at repo level — and the reviewable changes are G4–G6 only.

- [ ] **Step 3: Open the PR**

```
gh pr create \
    --base main \
    --head security/regression-guards \
    --title "Add automated security regression guards (G1–G6)" \
    --body-file /tmp/claude-fd84c4c2-76f5-4079-ba7f-2ab05ee557d5/pr-body.md
```

Expected: PR URL printed. Capture it.

- [ ] **Step 4: Verify all checks run**

```
gh pr checks
```

Expected (after a few minutes): `CI / build`, `CI / dependency-review`, and `CodeQL / analyze` all green. The CodeQL run on the PR's first push may take several minutes — re-run `gh pr checks` until they all complete.

- [ ] **Step 5: Hand off to user**

Print the PR URL and note that the PR is ready for review and squash-merge.

---

## Coverage check (matches spec §5)

| Threat | Spec ref | Plan task |
|---|---|---|
| Secret committed | G1 + G2 | Task 2 |
| New unsafe `set:html` in `.astro` | G6 | Task 4 |
| JSON-LD escape regressed | existing `schema.test.ts` | (no new task — already covered) |
| `_headers` directive removed | G5 | Task 3 |
| JS/TS sink introduced in `.ts` | G3 | Task 6 |
| Vulnerable dep introduced via PR | G4 | Task 5 |
| Unsafe workflow added | (out of scope per spec §6) | — |
