# *The old frame* essay — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a draft of the short-form essay *The old frame* into
`src/content/essays/the-old-frame.md`, sourced and illustrated, ready
for the author's final read before flipping `draft: false` and publishing.

**Architecture:** A single Markdown file in the Astro `essays` content
collection. Three acts, ~750 words total. 2–4 inline images in `public/`
referenced via the same `<figure>` pattern used in build #001. Per-post
Open Graph image is generated automatically by `astro-og-canvas` at
build time (no manual asset needed for OG). All work lands on a feature
branch and ships via a squash-merged PR.

**Tech Stack:** Astro 6, Markdown with frontmatter validated by the
schema in `src/content.config.ts`, ESLint, `astro check` (TypeScript),
`astro-og-canvas` (per-post OG), Wikimedia Commons (image sourcing),
GitHub PR workflow with squash merge.

**Reference documents:**
- Spec: `docs/superpowers/specs/2026-05-27-the-old-frame-essay-design.md`
- Voice reference: `src/content/builds/001-haddrell-from-scratch.md`
- Schema: `src/content.config.ts`

---

## File Structure

**Created:**
- `src/content/essays/the-old-frame.md` — the essay itself
- `public/the-old-frame-printing-press.jpg` (or similar) — image 1
- `public/the-old-frame-luddites.jpg` (or similar) — image 2
- `public/the-old-frame-<beat>.jpg` × 0–2 more (depending on what
  Wikimedia turns up; final selection driven by clean licences)
- `docs/superpowers/notes/2026-05-27-the-old-frame-sources.md` —
  verified sources scratchpad, used during drafting; deleted before PR
  if it duplicates the essay's inline links

**Modified:** none. The placeholder `the-adoption-gap.md` is untouched.

---

## Pre-flight

- [ ] **Step 0.1: Confirm we're on main and clean**

Run: `git -C /Users/jodre11/Repos/haddrell-blog status --short`
Expected: empty output (no uncommitted changes)

Run: `git -C /Users/jodre11/Repos/haddrell-blog branch --show-current`
Expected: `main`

If not clean, stop and resolve before starting.

- [ ] **Step 0.2: Pull latest**

Run: `git -C /Users/jodre11/Repos/haddrell-blog pull --ff-only`
Expected: `Already up to date.` or a clean fast-forward.

- [ ] **Step 0.3: Create feature branch**

Run: `git -C /Users/jodre11/Repos/haddrell-blog checkout -b essays/the-old-frame`
Expected: `Switched to a new branch 'essays/the-old-frame'`

---

## Task 1: Verify sources

**Files:**
- Create: `docs/superpowers/notes/2026-05-27-the-old-frame-sources.md`

**Purpose:** Verify each citation in the spec's Sourcing section before
drafting around it. If any source cannot be verified, the surrounding
claim is rewritten or dropped — not fudged. This task produces a
scratchpad of verified URLs and exact quote text that the drafting
tasks lean on.

- [ ] **Step 1.1: Create the sources scratchpad**

Create `docs/superpowers/notes/2026-05-27-the-old-frame-sources.md` with
this skeleton:

```markdown
# *The old frame* — verified sources

Working notes. Each source either VERIFIED with URL + exact quote, or
flagged with a substitute or a drop decision.

## Anthropic 2024 RCT
- Status:
- URL:
- Exact figure to cite:

## Plato, *Phaedrus* (Theuth)
- Status:
- URL:
- Exact quote:

## Gessner / print-overload
- Status:
- URL:
- Exact quote:
- Scholarly anchor (Blair):

## Luddites
- Status:
- URL:
- Key point to anchor:

## Clifford Stoll, *Newsweek* Feb 1995
- Status:
- URL:
- Exact quote:

## Krugman 1998 — "fax machine"
- Status:
- URL:
- Exact quote:

## Keynes 1930 — *Economic Possibilities for our Grandchildren*
- Status:
- URL:
- Exact quote (if used):

## Geoffrey Hinton
- Status:
- URL:
- Key point to anchor:
```

- [ ] **Step 1.2: Verify Anthropic RCT**

Use the `web-search` skill to confirm the URL is live and the 17pp
figure is correctly attributed. The expected primary URL is
`https://www.anthropic.com/research/AI-assistance-coding-skills`.

If 404 or moved, search `anthropic.com research AI assistance coding
skills RCT junior engineers 17` and use the canonical Anthropic URL.
Record in the scratchpad. If the figure is described differently in
the source than in the spec ("17 percentage points lower on
comprehension and debugging quizzes"), update the spec's wording in a
later commit and the essay's wording in the drafting tasks.

- [ ] **Step 1.3: Verify each remaining source**

Repeat the verification pattern for each entry in the scratchpad. For
each:
1. Search with `web-search -n 5` using a tight query.
2. Open the most authoritative URL (Perseus for Plato, Yale UP for
   Blair, BL/Smithsonian/Hobsbawm for Luddites, original Newsweek
   archive or reputable secondary for Stoll, original Red Herring
   archive or reputable secondary for Krugman, public-domain text host
   for Keynes, NYT or Nobel coverage for Hinton).
3. Confirm the quote/figure matches the spec.
4. Record verified URL + exact quote text in the scratchpad.

If a source can't be verified within ~3 searches, mark it FAILED and
note a substitute or a drop decision. Do not invent quotes.

- [ ] **Step 1.4: Commit the verified sources scratchpad**

Run: `git -C /Users/jodre11/Repos/haddrell-blog add docs/superpowers/notes/2026-05-27-the-old-frame-sources.md`
Run:
```bash
git -C /Users/jodre11/Repos/haddrell-blog commit -m "Verify sources for *The old frame* essay"
```

---

## Task 2: Source images from Wikimedia

**Files:**
- Create: `public/the-old-frame-*.{jpg,png}` (2–4 files)

**Purpose:** Find clean public-domain images for the priority beats
listed in the spec's Images section. Two strong images beat four weak
ones.

- [ ] **Step 2.1: Search Wikimedia for each candidate**

For each candidate in the spec's Images priority list:
1. Gutenberg-era printing press woodcut
2. Luddite-era illustration / power loom
3. Socrates bust or *Phaedrus* manuscript leaf
4. 1990s-internet artefact (most likely omitted)

Use a browser to search Wikimedia Commons. Filter by licence:
public-domain (PD-old-100 or equivalent) only. Avoid CC-BY-SA unless
the attribution overhead is acceptable.

- [ ] **Step 2.2: Download and rename**

For each chosen image:
1. Download the largest reasonable resolution (Wikimedia "Original file")
2. Save to `public/the-old-frame-<beat>.<ext>` (e.g.
   `public/the-old-frame-printing-press.jpg`)
3. Record the Wikimedia URL and licence in the sources scratchpad
   (under a new "## Images" section appended at the bottom)

If a beat has no suitable public-domain image, do not invent one;
flag in the scratchpad and proceed.

- [ ] **Step 2.3: Verify file sizes**

Each image should be < 500 KB to avoid bloating the build. Use
`identify` (ImageMagick) or open in Preview to check dimensions.
Target: ~1200px wide, JPEG quality 85.

If an image is too large, downscale using `sips` (macOS native):

```bash
sips -Z 1200 -s format jpeg -s formatOptions 85 public/the-old-frame-<beat>.jpg --out public/the-old-frame-<beat>.jpg
```

- [ ] **Step 2.4: Commit images**

Run: `git -C /Users/jodre11/Repos/haddrell-blog add public/the-old-frame-*.{jpg,png}`
Run: `git -C /Users/jodre11/Repos/haddrell-blog add docs/superpowers/notes/2026-05-27-the-old-frame-sources.md`
Run:
```bash
git -C /Users/jodre11/Repos/haddrell-blog commit -m "Add public-domain images for *The old frame* essay"
```

---

## Task 3: Create file with frontmatter and Act 1

**Files:**
- Create: `src/content/essays/the-old-frame.md`

**Purpose:** Bootstrap the file with valid frontmatter and the Act 1
draft. The frontmatter must satisfy the schema in
`src/content.config.ts` — required: `title`, `description`, `pubDate`,
`tags`, `draft`.

- [ ] **Step 3.1: Create the file with frontmatter and Act 1 placeholder**

Create `src/content/essays/the-old-frame.md`:

```markdown
---
title: "The old frame"
description: "TO BE WRITTEN — one line, replace before flipping draft to false."
pubDate: 2026-05-27
tags: ["agentic-tools", "ai", "history"]
draft: true
featured: false
---

<!-- Act 1 — The worry as voiced (~180 words). Per spec, this act opens
on the LinkedIn-clickbait genre, concedes Anthropic's 2024 RCT as
real evidence (52 mostly-junior engineers, 17pp lower comprehension /
debugging scores), and makes the move that the data is real but the
*interpretation* (juniors won't learn engineering) is the old frame
applied to new tooling. Refer to the spec for the full Act 1
description. -->

<!-- Act 2 placeholder — Task 4 will fill this in. -->

<!-- Act 3 placeholder — Task 5 will fill this in. -->
```

- [ ] **Step 3.2: Verify the schema accepts it**

Run: `cd /Users/jodre11/Repos/haddrell-blog && npm run check`
Expected: zero errors, zero warnings. If the schema rejects (e.g.
because `pubDate` is malformed), fix the frontmatter and retry.

- [ ] **Step 3.3: Draft Act 1 (~180 words)**

Replace the Act 1 comment with the actual prose. Draft following the
spec's Act 1 outline:
- Open by naming the LinkedIn-clickbait genre worry.
- Concede the worry has real evidence — cite Anthropic's RCT with the
  exact figure verified in Task 1 (link to the verified URL).
- Make the move: the *data* is real; the *interpretation* (juniors
  won't learn engineering) is the old frame applied to new tooling.
- Frame as "the establishment voice, formed by yesterday's frame,
  asking yesterday's question".

Voice rules (match `001-haddrell-from-scratch.md`):
- First person sparingly, for judgement not narration
- Inline links; link text reads as the named thing
- No exclamation marks, no breezy openers, no "TL;DR"

Word target: ~180. Acceptable range: 150–210.

- [ ] **Step 3.4: Read Act 1 back end-to-end**

Open the file in a viewer (VS Code preview, Quick Look, or `npm run
dev` and the live page at `http://localhost:4321/essays/the-old-frame/`).
Read it aloud once. If a sentence catches, rewrite it before
proceeding.

- [ ] **Step 3.5: Commit**

Run: `git -C /Users/jodre11/Repos/haddrell-blog add src/content/essays/the-old-frame.md`
Run:
```bash
git -C /Users/jodre11/Repos/haddrell-blog commit -m "Draft Act 1 of *The old frame* essay"
```

---

## Task 4: Draft Act 2 (the pattern)

**Files:**
- Modify: `src/content/essays/the-old-frame.md`

**Purpose:** Add the four historical beats. The argument is the
*repetition* of the pattern, not any single example. Total Act 2
budget: ~370 words.

- [ ] **Step 4.1: Write the pattern claim**

Open the act with the pattern claim in 2–3 sentences. Suggested
opening (rewrite as needed): "When transformative technology arrives,
the established voices of the day misframe it through old criteria.
The pattern is older than any one example."

- [ ] **Step 4.2: Beat 1 — Socrates on writing (~80 words)**

Cite *Phaedrus*, Theuth myth. Quote should be short — one sentence at
most. Link to the verified Perseus URL from Task 1. Land the point:
the established voice judged the new medium by the criteria of the
old (memorisation).

- [ ] **Step 4.3: Beat 2 — Print-overload, 1545 (~80 words)**

Open with Gessner's "confusing and harmful abundance of books". Cite
Ann Blair's *Too Much to Know* as the scholarly anchor (link to Yale
UP page). Land the point: the new technology was real but the
proposed response (resist the abundance) was the wrong frame.

- [ ] **Step 4.4: Beat 3 — Luddites (~110 words, carries slightly more)**

Carefully drawn beat. Acknowledge the Luddites were *right* about the
threat (livelihoods destroyed) — this is the non-trivial reading. Then
the move: they were wrong about the *lever*. The frame ("preserve the
old industry") was the trap. Link to the verified Luddite source from
Task 1. This beat proves the essay isn't "the worried were stupid"
— it's "the old frame couldn't see the new lever".

- [ ] **Step 4.5: Beat 4 — 1990s internet (~80 words)**

Cite Stoll's *Newsweek* 1995 piece and Krugman's "fax machine" line.
Brief, modern, lands the pattern in living memory. Use the verified
URLs from Task 1.

- [ ] **Step 4.6: Optional in-discipline echo (one sentence)**

If the draft sustains it without bursting the budget, add one
sentence on the FORTRAN reception (early programmers worried high-level
languages would produce inefficient code compared to hand-tuned
assembly). Drop if Act 2 is already at ~370 words.

- [ ] **Step 4.7: Read Act 2 end-to-end, check word count**

Run: `wc -w src/content/essays/the-old-frame.md`
Expected: file total around 350–450 words (Act 1 + Act 2 so far).

If Act 2 is significantly over budget, tighten the longest beat. If
under budget, the Luddites beat probably needs more air.

- [ ] **Step 4.8: Commit**

Run: `git -C /Users/jodre11/Repos/haddrell-blog add src/content/essays/the-old-frame.md`
Run:
```bash
git -C /Users/jodre11/Repos/haddrell-blog commit -m "Draft Act 2 of *The old frame* essay"
```

---

## Task 5: Draft Act 3 (the pivot)

**Files:**
- Modify: `src/content/essays/the-old-frame.md`

**Purpose:** The positive close. Restate the pattern in its sharpest
form, then move forward. ~200 words.

- [ ] **Step 5.1: Restate the pattern in its sharpest form**

One or two sentences. Suggested (rewrite as needed): "The wise weren't
wrong about the worry. They were applying yesterday's criteria, and
the criteria were about to change."

- [ ] **Step 5.2: The agentic-fluency bullet**

The next generation will find uses we haven't imagined; they're not
held back by our frame. The work is to equip them to be *good* at this
tooling — agentic fluency is the engineering skill of their era. The
job is teaching, not protection.

- [ ] **Step 5.3: Closer-to-the-tin caveat**

One short paragraph (~30 words) acknowledging that a niche for
closer-to-the-tin skills (compilers, kernels, embedded, the parts
where abstraction leaks) remains. The essay is not claiming everyone
moves up the abstraction stack.

- [ ] **Step 5.4: Keynes nod (one sentence)**

A single sentence pointing at Keynes's *Economic Possibilities for our
Grandchildren* (1930) as evidence the "what will people do?" question
is older than agents and survives every transition. Link to the
verified URL from Task 1.

- [ ] **Step 5.5: Real concerns — security and Hinton**

Real concerns exist. Security at machine speed: vulnerabilities surface
faster than humans can patch them; the answer is to harness the same
tools that surface them. Name Geoffrey Hinton as a pioneer *applying*
fresh thinking to AI safety, not retreating into the old frame. Link
to a verified Hinton interview from Task 1.

- [ ] **Step 5.6: Positive landing**

Close: the solutions will be new, fresh, and exciting — and they'll
come from people who weren't bound by yesterday's frames.

- [ ] **Step 5.7: Check total word count**

Run: `wc -w src/content/essays/the-old-frame.md`
Expected: 600–900 words excluding frontmatter. If over 900,
tighten Act 2's longest beat first; Act 3 should land at ~200.

- [ ] **Step 5.8: Commit**

Run: `git -C /Users/jodre11/Repos/haddrell-blog add src/content/essays/the-old-frame.md`
Run:
```bash
git -C /Users/jodre11/Repos/haddrell-blog commit -m "Draft Act 3 of *The old frame* essay"
```

---

## Task 6: Embed images with figure markup

**Files:**
- Modify: `src/content/essays/the-old-frame.md`

**Purpose:** Place the images committed in Task 2 into the prose at
the right beats, with proper attribution captions.

- [ ] **Step 6.1: For each image, insert a `<figure>` block**

Use the same pattern as `001-haddrell-from-scratch.md` (lines 92–98).
For each image:

```html
<figure style="margin-left:0;margin-right:0;max-width:var(--max-measure);">
    <img
        src="/the-old-frame-<beat>.jpg"
        alt="<descriptive alt text>"
        style="width:100%;height:auto;" />
    <figcaption style="margin-top:0.75rem;">
        <em>Caption text.</em> Source: <a href="<Wikimedia URL>">Wikimedia Commons</a>, public domain.
    </figcaption>
</figure>
```

Place each figure immediately after the paragraph it illustrates. Do
not embed inside a beat paragraph; figures sit between paragraphs.

- [ ] **Step 6.2: Verify the build still parses Markdown + HTML**

Run: `cd /Users/jodre11/Repos/haddrell-blog && npm run check`
Expected: zero errors, zero warnings.

Run: `cd /Users/jodre11/Repos/haddrell-blog && npm run dev` (background)
Visit `http://localhost:4321/essays/the-old-frame/` and confirm each
image renders, captions render, layout sits inside the measure.

Stop the dev server.

- [ ] **Step 6.3: Commit**

Run: `git -C /Users/jodre11/Repos/haddrell-blog add src/content/essays/the-old-frame.md`
Run:
```bash
git -C /Users/jodre11/Repos/haddrell-blog commit -m "Embed images in *The old frame* essay"
```

---

## Task 7: Final polish — description, end-to-end read

**Files:**
- Modify: `src/content/essays/the-old-frame.md`

- [ ] **Step 7.1: Write the one-line `description:` frontmatter**

Replace the placeholder description. The description appears in card
indexes, RSS feed, and Open Graph. Target: 120–160 characters, names
the thesis without being a teaser. Voice: declarative, calm.

Suggested (rewrite as needed): "Why the establishment voice of every
technological transition misreads the new tooling through old criteria
— and how the next generation finds the answer."

- [ ] **Step 7.2: Read the whole essay end-to-end**

Read it aloud once. Specifically check:
- Does the Act 1 → Act 2 → Act 3 movement land?
- Does each beat carry its own weight, or is one beat thinner than the
  others?
- Is the Luddite beat the most carefully written? (It should be — it
  carries the "right concern, wrong lever" nuance.)
- Is the closing line crisp?
- Are there any links with vague link text ("here", "this article")?
  Fix them to read as the named thing.

- [ ] **Step 7.3: Run word count one more time**

Run: `wc -w src/content/essays/the-old-frame.md`
Expected: 600–900 words excluding frontmatter.

- [ ] **Step 7.4: Commit polish if any changes made**

Run: `git -C /Users/jodre11/Repos/haddrell-blog status --short`
If there are changes:
Run: `git -C /Users/jodre11/Repos/haddrell-blog add src/content/essays/the-old-frame.md`
Run:
```bash
git -C /Users/jodre11/Repos/haddrell-blog commit -m "Polish *The old frame* essay"
```

---

## Task 8: Verify build, lint, and dev preview

- [ ] **Step 8.1: Type check**

Run: `cd /Users/jodre11/Repos/haddrell-blog && npm run check`
Expected: zero errors, zero warnings. If anything fails, fix and re-run
before continuing.

- [ ] **Step 8.2: Lint**

Run: `cd /Users/jodre11/Repos/haddrell-blog && npm run lint`
Expected: zero errors, zero warnings. ESLint applies to JS/TS, not
Markdown, so this should pass uninvolved by this essay; failure
indicates an unrelated regression that should be investigated.

- [ ] **Step 8.3: Full production build**

Run: `cd /Users/jodre11/Repos/haddrell-blog && npm run build`
Expected: build succeeds. Confirm output contains the essay:

Run: `ls /Users/jodre11/Repos/haddrell-blog/dist/essays/the-old-frame/`
Expected: `index.html` plus the `.md` companion file.

Note: posts with `draft: true` are excluded from the build in
production. To verify draft handling, this build should *include* the
essay only if Astro's draft handling is set to include drafts in dev/
PR previews. If `dist/essays/the-old-frame/` does not exist, that is
expected behaviour for `draft: true` — flip to `draft: false` only
when ready to publish.

- [ ] **Step 8.4: Dev preview**

Run: `cd /Users/jodre11/Repos/haddrell-blog && npm run dev` (background)
Visit `http://localhost:4321/essays/the-old-frame/` and check:
- Page renders with title, dates, tags
- All four (or however many) images render with captions
- All links resolve (Cmd-click each to spot-check)
- The page Open Graph image (auto-generated) renders by visiting
  `http://localhost:4321/og/essays/the-old-frame.png` or wherever the
  `astro-og-canvas` integration serves it

Stop the dev server.

---

## Task 9: Open PR and merge

- [ ] **Step 9.1: Push the branch**

Run: `git -C /Users/jodre11/Repos/haddrell-blog push -u origin essays/the-old-frame`

- [ ] **Step 9.2: Write the PR body to a temp file**

Per repo convention (no Co-Authored-By, no Claude advertising; PR
description begins with brief contextual summary for non-technical
audience). Write to `${CLAUDE_TEMP_DIR}/pr-body.md`:

```markdown
This pull request adds a new short-form essay to the `/essays`
collection titled *The old frame*. The piece argues that the
established voices of every technological transition misframe the new
tooling through the criteria of the old — illustrated through four
historical examples (Socrates on writing, the printing press,
Luddites, 1990s internet pundits) — before pivoting to a positive
close about agentic tooling, AI safety, and where the next generation
fits in.

The essay ships as a draft (`draft: true`); flipping to `draft: false`
in a separate commit is what actually publishes it.

## Changes

- New: `src/content/essays/the-old-frame.md`
- New: 2–4 public-domain images in `public/the-old-frame-*.jpg`
- New: source-verification scratchpad in
  `docs/superpowers/notes/2026-05-27-the-old-frame-sources.md`
- Spec referenced:
  `docs/superpowers/specs/2026-05-27-the-old-frame-essay-design.md`

## Validation

- `npm run check` — clean
- `npm run lint` — clean
- `npm run build` — clean (essay excluded from `dist/` because
  `draft: true`)
- Dev preview at `http://localhost:4321/essays/the-old-frame/` rendered
  end-to-end, all images and links working
```

- [ ] **Step 9.3: Open the PR**

Run:
```bash
gh pr create --title "Add *The old frame* essay (draft)" --body-file ${CLAUDE_TEMP_DIR}/pr-body.md --base main
```
Expected: returns a PR URL. Capture and report it.

- [ ] **Step 9.4: Wait for CI**

Run: `gh pr checks --watch`
Expected: all checks pass.

If a check fails, investigate and fix on the branch; do not skip hooks.

- [ ] **Step 9.5: Author review gate**

This is a content PR. Hand it back to the author for final review
before merging. Do not merge until the author has explicitly approved
the essay's substance.

- [ ] **Step 9.6: Squash merge (author triggers; agent only runs on explicit go)**

When the author says go:
```bash
gh pr merge --squash --delete-branch
```

- [ ] **Step 9.7: Switch back to main, pull**

Run: `git -C /Users/jodre11/Repos/haddrell-blog checkout main`
Run: `git -C /Users/jodre11/Repos/haddrell-blog pull --ff-only`

---

## Out of scope for this plan

- **Flipping `draft: false` to publish.** Separate one-line commit;
  intentionally not part of this plan so the author can pace
  publication.
- **Tweeting / posting about it.** Not on this blog's workflow.
- **Per-post Open Graph image customisation beyond the default
  generated by `astro-og-canvas`.**
- **Adding a fifth historical example.** Spec out of scope.
- **A separate post on the post-work / Keynes thread.** Spec out of
  scope; would be its own essay.

---

## Self-review checklist (for the agent before handing back)

- [ ] Word count is in the 600–900 range
- [ ] Each cited source has a verified URL in the scratchpad
- [ ] Each image has attribution in its `<figcaption>`
- [ ] The Luddite beat carries the "right concern, wrong lever" nuance
  (not "they were stupid")
- [ ] Act 3 includes both the agentic-fluency *and* the
  closer-to-the-tin caveat
- [ ] No links with vague link text ("click here", "this article")
- [ ] Frontmatter `description:` is the real description, not the
  placeholder
- [ ] Build is clean, lint is clean
- [ ] `draft: true` is still set (the plan does NOT publish)
