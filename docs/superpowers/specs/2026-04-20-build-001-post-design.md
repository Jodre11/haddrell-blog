# Build #001 — "Haddrell from scratch" — Post Design Spec

**Date:** 2026-04-20
**Owner:** Christian Haddrell
**Target file:** `src/content/builds/001-haddrell-from-scratch.md`
**Replaces:** the placeholder currently at that path.

## 1. Premise

An experienced engineer rebuilt his web presence using agentic tools — here's
what was decided and why, in the order it happened. No claims, no thesis. The
diff is the receipt.

The post is a **build log** (primary), with a personal **why-now intro** at
the front. It is *not* a stack-rationale piece — the stack choices were largely
the agent's recommendations sanity-checked by the author, and defending them
in depth would be inauthentic. It does *not* share a thesis with the
companion essay `the-adoption-gap.md`; the two posts stand alone, and the
essay may or may not ship.

## 2. Audience & posture

Aligned with the site design spec (`docs/superpowers/specs/2026-04-16-haddrell-blog-design.md`):
prospective employers and clients evaluating whether the author is the right
senior engineer for their team, plus peers who find the post via search or
syndication.

Posture: **show, don't sell.** Receipts are the antidote to grandiose. A
careful colleague reading any sentence should think *fair* — never *who does
he think he is?*

## 3. Structure

### 3.1 Intro (~250–350 words)

Four beats:

1. **The unwritten blog.** I have read engineering blogs for years and have
   considered writing one for as long as I can remember.
2. **Why I never did.** Clients and employers came first; the effort/output
   maths on a blog never favoured it against billable work, so it stayed an
   idea.
3. **What changed.** Two things together.
   - **(a)** Agentic tooling dropped the cost of setting up and maintaining
     something like this from "months of evenings" to "a couple of evenings".
   - **(b)** My own work has shifted: less time deep in code in the slower
     flow state I used to enjoy, more time at the product and team-leadership
     level. A *proportion* change, not a new role.
4. **Handoff.** "What follows is the build itself, in the order it happened —
   about two evenings of focused work, spread across a week."

#### Voice guardrails for the intro

- Keep the phrase *"the slower flow state process, which I previously
  enjoyed"* (or close to it) verbatim — it is the most honest line in the
  piece and earns the rest of the post.
- First person only. No generalising about engineers as a class.
- Do not sell agentic tooling. Describe what it did for you and stop.
- "Team leadership" is framed as a proportion shift — never as something new.
  The author has led human teams before; that is a separate article and is
  out of scope here.
- No mention of token budgets or rate limits as the reason for the
  one-week-vs-two-evenings spread. (The spread is real but explaining it via
  budget reads as cheap.)

### 3.2 Loop framing (~80 words)

A single short paragraph between intro and body, naming the working pattern
so the reader has a label for what follows. Approximately:

> The shape of every step was the same: brainstorm with the agent until the
> intent was sharp; have the agent write a plan I could read and critique;
> have the agent execute the plan with me reviewing each move. Not a
> manifesto — just the loop.

No claims about the loop being novel or universal. Just the working pattern
on this build.

### 3.3 Body — seven chronological stops (~150–250 words each)

Stops follow the actual order of the build (see the git log; commits cited
inline where they help).

1. **Plan first, code second.** `npm create astro@latest` ran on day one.
   Then everything stopped. `PLAN.md` and `CONTEXT.md` were written before
   any further code, then critiqued and revised. *Receipt:* the discipline
   of making the agent write the plan up front and earning the critique
   before letting it touch the codebase.

2. **Identity & voice.** The Dougal mark, IBM Plex over a system stack, the
   editorial palette, the anti-AI cues (asymmetric layout, hairlines instead
   of shadows, named typeface, specific accent red, human date format like
   `15 Apr 2026`). *Receipt:* deliberate aesthetic choices that don't read
   as LLM-default.

   **Inline aside — Dougal source photograph.** A tightly-cropped, EXIF-
   stripped photograph of the real Dougal (a black and grey dog wearing red-
   rimmed glasses) sits above the abstracted three-colour SVG mark in this
   stop, with one short caption on the abstraction lineage. See section 4
   for the photo handling rules. No anecdote about the dog himself.

3. **Content model.** Two collections — *essays* and *builds*. Builds are
   numbered (`001`, `002`, …) for continuity and are personal projects only;
   client work never appears. Tags cut across both types. No comments, no
   newsletter, no stated cadence. *Receipt:* schema-first, scope bounded by
   what I would actually maintain.

4. **Agent-readability as a first-class concern.** `llms.txt`, `llms-full.txt`,
   a `.md` companion alongside every post, JSON-LD `BlogPosting` on detail
   pages, Pagefind for client-side search, RSS with full content rather than
   excerpts. *Receipt:* the site is designed to be read by software as well
   as people, and that wasn't a plugin afterthought.

5. **Deployment, and a plan reversal.** Cloudflare Pages was the deployment
   target from the start. The original `PLAN.md` said *don't* move
   nameservers from GoDaddy / Microsoft Domain Connect (to protect family
   email on the M365 Family SKU). In execution we reconsidered, moved the
   zone to Cloudflare anyway, and preserved the original nameservers as a
   documented rollback. *Receipt:* the most honest moment of the build — the
   plan changed mid-flight and we wrote down why.

6. **Post-launch hardening.** OG image and meta tags for social sharing, a
   GitHub icon in the header, a code-review pass, a CI workflow, lint and
   type-check in CI, Dependabot enabled, the `yaml` transitive pinned to
   address a CVE. *Receipt:* the work after "it's live" — the unsexy part
   that signals an actual maintained thing.

7. **Gaps.** A short section in observational present tense. Two items only:
   - The Open Graph image is shared across every page rather than generated
     per post. Fine for the launch; build cards would read better with their
     own.
   - There is no link checker in the CI pipeline. For a static blog with no
     unit tests, that is the realistic failure mode as posts accumulate.

   *Closing line for this stop:* "None of that is a roadmap. It's just what
   I'd notice if I were reading the site for the first time." This line is
   load-bearing — it explicitly disclaims commitment and prevents the
   section from reading as a public IOU.

   *Out of scope for this stop:* DNS hygiene (a stale Google Search Console
   verification CNAME and the DMARC escalation plan) and the about-page
   sparseness. The first is
   infra-level and not visible to a site reader; the second is intentional
   (LinkedIn carries the detail).

### 3.4 Close (~50 words)

One short paragraph. Two beats only:

1. The repo is public — a brief link.
2. Future builds will appear here as `002-…`, `003-…`, and so on.

No predictions, no thesis, no thanks list. The site itself is the artefact;
the close just hands the reader the next pointer.

## 4. Dougal source photograph — handling

**Source:** `/Users/jodre11/Library/CloudStorage/OneDrive-Personal/Documents/Dougal Debug Limited/Branding/Dougal in glasses.JPEG`
(personal cloud storage; not in the repo).

**Processed output:** `public/dougal-source.jpg` (kebab-case, lowercase
extension).

**Treatment:**

1. **Crop tight** to head and shoulders. This removes the floor, the
   furniture, and the household items in the soft-focus background — the
   actual anonymisation work. The bokeh helps but is not sufficient on its
   own.
2. **Re-encode through `sharp`** (already a dependency). `sharp` does *not*
   preserve EXIF on output unless `.withMetadata()` is called explicitly —
   so do not call it. The default re-encode strips embedded location,
   camera, and timestamp data.
3. **Resize** to approximately 1200 px on the long edge — ample for the
   editorial column, much smaller than the source.
4. **Aspect** — portrait or roughly square after the crop, so it sits above
   the SVG mark in a single column without dominating.
5. **Markdown placement.** Rendered inline in stop 2 ("Identity & voice"),
   stacked vertically: photograph on top, SVG mark below, single caption
   underneath both spelling out the abstraction lineage.
6. **Alt text:** *"Photograph of a black and grey dog wearing red-rimmed
   glasses."* Factual; the dog is not named in the alt text.

The processing itself is an implementation step, not a design step.

## 5. Voice guardrails — body

- **Show, don't sell.** The diff is the receipt. Don't editorialise the
  wins ("which turned out brilliantly", "a great choice").
- **Past tense, plain.** "I chose X because Y." "I rejected Z because…"
- **Specific over general.** Name files, components, commits where it
  serves clarity. Avoid abstractions.
- **No future tense outside the close** that commits to delivery. No
  "I'll", "next", "soon" — including in stop 7, where the disclaimer line
  is the explicit guard.
- **No reader-facing recommendations.** No "you should…", no "consider X".
- **Tone reference points** (per the site design spec): Eric Lippert's
  clarity of exposition; Scott Hanselman's breadth and warmth.

## 6. Scope

**In scope.**

- The build itself, in chronological order.
- The working loop (brainstorm → plan → execute → review).
- Specific decisions made during the build, including their rationale.
- The DNS plan reversal and what it cost / preserved.
- The two-item Gaps observation in stop 7.
- The Dougal source photograph, cropped and stripped, in stop 2.

**Out of scope.**

- Any client work or engagement-specific content (always — site-wide rule).
- The broader thesis on agentic tooling and engineering workflow (essay
  territory; covered separately in the draft `the-adoption-gap.md`, which
  this post does *not* link to or reference).
- Industry predictions; comparisons with other engineers' workflows.
- Reader-facing recommendations or "you should" advice.
- The author's prior team-leadership experience (separate future article).
- DNS hygiene follow-ups and the about-page question (tracked in
  `project_site_followups.md` in auto-memory; not surfaced on the site).
- Token-budget framing for the calendar-vs-effort spread.

## 7. Length targets

| Section            | Target words |
|--------------------|--------------|
| Intro              | 250–350      |
| Loop framing       | ~80          |
| Stops 1–6          | 150–250 each |
| Stop 7 (Gaps)      | ~120         |
| Close              | ~50          |
| **Total**          | **~1500–2000** |

Quality over breadth. The repo is public; readers wanting more detail follow
the link rather than getting it inline.

## 8. Frontmatter changes

Apply to `src/content/builds/001-haddrell-from-scratch.md`:

```yaml
---
title: "Haddrell from scratch"
description: "Building this site with agentic tools — what was decided, in the order it happened."
pubDate: <actual publish date — set on publish, not on draft>
number: 1
tags: ["astro", "cloudflare", "agentic-tools", "meta"]
draft: true   # flip to false at publish
featured: false
---
```

Notes:

- `description` replaces the placeholder. Wording is a starting point — the
  author may rephrase before publish.
- `tags` adds `agentic-tools` to align with the site's primary topic axis;
  other tags from the placeholder retained.
- `draft: true` until the post is reviewed and published; flip then.

## 9. References

- `docs/superpowers/specs/2026-04-16-haddrell-blog-design.md` — site design
  spec (positioning, content model, agent-readability requirements, voice
  reference points).
- `docs/superpowers/plans/2026-04-16-haddrell-blog.md` — the implementation
  plan that built the site this post describes.
- `PLAN.md` — deployment plan and the deferred-items list.
- `CONTEXT.md` — constraints on email, DNS authority, DKIM availability.
- `project_site_followups.md` (auto-memory) — gaps deliberately excluded
  from this post but tracked for later.
- `public/dougal.svg` — the abstracted SVG mark whose source photograph this
  post will include.
