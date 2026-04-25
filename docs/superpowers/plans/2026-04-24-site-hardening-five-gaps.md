# Site Hardening: Five Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the five rough edges identified after launching the site: enable PR preview deploys, add a link checker, harden JSON-LD, generate per-post OG images, and add accessibility checks to CI.

**Architecture:** Five independent phases, each landing as its own PR to `main`. Every phase is self-contained and independently valuable — a later phase can be skipped or deferred without breaking earlier ones. Branch protection on `main` requires PRs, so each phase gets a branch, a PR, review, and merge.

**Tech Stack:** Astro 6.1.6, TypeScript 5.9, Node 22.12+, ESLint 10, Cloudflare Workers (static assets), GitHub Actions. Site uses `@astrojs/sitemap`, `@astrojs/rss`, `@astrojs/mdx`, `astro-pagefind`. Deploys via Cloudflare Workers Builds (Cloudflare's managed CI triggered by pushes to `main`).

**No unit test framework is configured.** Verification for each phase is: `astro check` passes, `astro build` passes, and a manual visual check on the PR preview URL (once Phase 1 lands; until then, local `npm run preview`). Each phase's "Verify" steps list exact commands and expected output.

**Sequencing rationale:** Phase 1 ships first so every subsequent PR has a preview URL. Phases 2–3 are small and quick. Phase 4 is the largest code change. Phase 5 runs last so its sitemap-driven scan covers everything built in earlier phases.

---

## File Structure

**New files:**
- `.github/workflows/links-pr.yml` — lychee internal-only link check on PRs
- `.github/workflows/links-cron.yml` — lychee full check weekly, opens issue on failure
- `.github/workflows/a11y.yml` — pa11y-ci accessibility scan on PRs
- `.lycheeignore` — known-noisy external hosts to skip
- `.pa11yci.json` — pa11y-ci config (drives from sitemap-index.xml)
- `src/lib/schema.ts` — typed JSON-LD builders using `schema-dts`
- `src/pages/og/[...slug].png.ts` — astro-og-canvas endpoint generating per-post OG PNGs
- `src/assets/fonts/IBMPlexSans-Regular.ttf` — TTF copy for Satori (doesn't support woff2)
- `src/assets/fonts/IBMPlexSans-SemiBold.ttf` — SemiBold TTF for OG title weight

**Modified files:**
- `src/components/BaseHead.astro` — add `ogImage?: string` prop; default to `/og.png`
- `src/layouts/Post.astro` — import schema helpers; pass per-post `ogImage`
- `src/pages/index.astro` — add `WebSite` JSON-LD
- `src/pages/about.astro` — add `Person` + `AboutPage` JSON-LD
- `.github/workflows/ci.yml` — unchanged in Phase 5 (a11y lives in its own workflow for isolation)
- `package.json` — add dev deps: `astro-og-canvas`, `schema-dts`, `pa11y-ci`, `serve`

---

## Phase 1: Cloudflare Workers Preview URLs

**Branch:** `feat/preview-urls`

**Summary:** Enable Cloudflare's native per-PR Preview URLs. Zero code change if Workers Builds is already handling deploys — just a dashboard toggle and a verification PR.

**Files:**
- No code files modified. Configuration-only.
- Verify: open a throwaway PR to confirm preview URL is posted as a comment.

- [ ] **Step 1: Confirm deploy mechanism**

Check whether Cloudflare Workers Builds is wired to the repo. Run:
```bash
grep -rE "wrangler deploy|cloudflare/wrangler-action" .github/workflows/
```
Expected: no matches (confirms Workers Builds is the deploy path, not a self-managed GH Action).

If matches exist, Phase 1 becomes "add a `wrangler versions upload` step to the deploy workflow" — see `developers.cloudflare.com/workers/ci-cd/builds/` for the alternative. The rest of this plan assumes Workers Builds is in use.

- [ ] **Step 2: Enable Preview URLs in Cloudflare dashboard**

User action (not scriptable):
1. Log in to `dash.cloudflare.com` as `christian@haddrell.co.uk`
2. Navigate: Workers & Pages → `haddrell-blog` → Settings → Builds → Preview URLs
3. Toggle **Preview URLs** to **On**
4. Under "Non-production branch behaviour", set to **Build all non-production branches**

Docs: `developers.cloudflare.com/workers/configuration/previews/`

- [ ] **Step 3: Open a verification PR**

Create a trivial branch to confirm previews work end-to-end:
```bash
git checkout -b chore/verify-preview-urls
```

Add a single-line comment to `README.md` (e.g. ` <!-- preview test -->`). Then:
```bash
git add README.md
git commit -m "chore: verify preview URL generation"
git push -u origin chore/verify-preview-urls
gh pr create --title "chore: verify preview URLs" --body "One-line comment to test Cloudflare Workers Preview URL generation. Close without merging once the preview comment appears."
```

- [ ] **Step 4: Verify preview URL appears on PR**

Expected: within 2-3 minutes, Cloudflare Workers Builds posts a comment on the PR containing a preview URL like `https://<hash>.haddrell-blog.christian-d5a.workers.dev`. Visit the URL — the site should render identically to production.

- [ ] **Step 5: Close verification PR without merging**

```bash
gh pr close chore/verify-preview-urls --delete-branch
```

Phase 1 is complete. No merge required — the dashboard toggle is the durable change. All subsequent phases can rely on preview URLs being posted to their PRs.

---

## Phase 2: Link Checker

**Branch:** `feat/link-checker`

**Summary:** Add two lychee workflows — a fast internal-only check on every PR, and a weekly full external check that opens an issue on failure. Catches stale links as posts accumulate.

**Files:**
- Create: `.github/workflows/links-pr.yml`
- Create: `.github/workflows/links-cron.yml`
- Create: `.lycheeignore`

- [ ] **Step 1: Create `.lycheeignore`**

Known-noisy hosts that frequently rate-limit GitHub Actions runners. Add to repo root:

```
# LinkedIn aggressively rate-limits non-browser User-Agents
https://www\.linkedin\.com/.*
# GitHub search queries return 429 from CI IPs
https://github\.com/search\?.*
```

- [ ] **Step 2: Create PR link-check workflow**

Create `.github/workflows/links-pr.yml`:

```yaml
name: Link check (internal)

on:
    pull_request:
        paths:
            - 'src/content/**'
            - 'src/pages/**'
            - 'src/layouts/**'
            - 'src/components/**'
            - '**/*.md'

jobs:
    internal-links:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: '22'
                  cache: npm
            - run: npm ci
            - run: npm run build
            - name: Check internal links only
              uses: lycheeverse/lychee-action@v2
              with:
                  args: >-
                      --no-progress
                      --offline
                      --include-fragments
                      './dist/**/*.html'
                  fail: true
```

The `--offline` flag checks internal references only (no network). Fast, deterministic, won't flake on external outages.

- [ ] **Step 3: Create weekly cron link-check workflow**

Create `.github/workflows/links-cron.yml`:

```yaml
name: Link check (full)

on:
    schedule:
        - cron: '0 6 * * 1'  # Mondays 06:00 UTC
    workflow_dispatch:

jobs:
    full-links:
        runs-on: ubuntu-latest
        permissions:
            issues: write
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: '22'
                  cache: npm
            - run: npm ci
            - run: npm run build
            - name: Check all links (internal + external)
              id: lychee
              uses: lycheeverse/lychee-action@v2
              with:
                  args: >-
                      --no-progress
                      --include-fragments
                      --max-retries 3
                      --retry-wait-time 10
                      --accept 200,429
                      './dist/**/*.html'
                  fail: false
                  output: ./lychee-report.md
            - name: Open issue on failure
              if: steps.lychee.outputs.exit_code != 0
              uses: peter-evans/create-issue-from-file@v5
              with:
                  title: 'Broken links detected (weekly scan)'
                  content-filepath: ./lychee-report.md
                  labels: link-rot, automated
```

`--accept 200,429` treats rate-limited responses as OK (they're not actually broken). Issue opens only on real 4xx/5xx.

- [ ] **Step 4: Verify workflows parse**

```bash
npx -y action-validator@latest .github/workflows/links-pr.yml
npx -y action-validator@latest .github/workflows/links-cron.yml
```
Expected: both report `✓ Schema validation passed` (or equivalent).

- [ ] **Step 5: Commit and open PR**

```bash
git checkout -b feat/link-checker
git add .github/workflows/links-pr.yml .github/workflows/links-cron.yml .lycheeignore
git commit -m "feat: add lychee link checker (PR + weekly cron)"
git push -u origin feat/link-checker
gh pr create --title "Add lychee link checker workflows" --body "$(cat <<'EOF'
Adds two link-check workflows: a fast internal-only check on PRs touching content, and a weekly full external scan that opens an issue on failure.

## Summary
- `links-pr.yml` runs lychee with `--offline` on every PR touching content/pages/layouts/components; fails the PR on broken internal references.
- `links-cron.yml` runs a full scan every Monday 06:00 UTC; opens a GitHub issue (labelled `link-rot`) if any external link fails with 4xx/5xx.
- `.lycheeignore` excludes hosts that rate-limit CI runners (LinkedIn, GitHub search).

## Test plan
- [ ] PR workflow runs green on this PR (only workflow files changed, nothing to check internally yet)
- [ ] Manually trigger `links-cron` via `gh workflow run "Link check (full)"` post-merge to confirm it passes against current site content
EOF
)"
```

- [ ] **Step 6: Verify on merged main**

After merge:
```bash
gh workflow run "Link check (full)"
gh run watch
```
Expected: workflow completes successfully. If it fails, inspect the issue it opens and resolve before proceeding to Phase 3.

---

## Phase 3: JSON-LD Hardening

**Branch:** `feat/structured-data`

**Summary:** Post.astro already emits `BlogPosting` JSON-LD as an untyped object literal. Phase 3 adds `schema-dts` type safety, extracts a reusable helper, and adds `WebSite` (home) and `Person` (about) schemas.

**Files:**
- Create: `src/lib/schema.ts`
- Modify: `src/layouts/Post.astro` (lines 15-26, 62 — replace inline schema with helper)
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `package.json` (add `schema-dts` dev dep)

- [ ] **Step 1: Install schema-dts**

```bash
npm install --save-dev schema-dts
```

Expected: `package.json` `devDependencies` gains `"schema-dts": "^<latest>"`. It's types-only (no runtime cost).

- [ ] **Step 2: Create `src/lib/schema.ts`**

Typed builders and a single safe-serialisation helper. Create the file:

```typescript
import type { BlogPosting, Person, WebSite, WithContext } from 'schema-dts';
import { AUTHOR_NAME, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../consts';

const AUTHOR: Person = {
    '@type': 'Person',
    name: AUTHOR_NAME,
    url: SITE_URL,
    sameAs: ['https://www.linkedin.com/in/christian-haddrell/'],
};

export function websiteSchema(): WithContext<WebSite> {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        author: AUTHOR,
    };
}

export function personSchema(): WithContext<Person> {
    return {
        '@context': 'https://schema.org',
        ...AUTHOR,
    };
}

interface BlogPostingInput {
    title: string;
    description: string;
    url: string;
    pubDate: Date;
    updatedDate?: Date;
    tags: string[];
    imageUrl?: string;
}

export function blogPostingSchema(input: BlogPostingInput): WithContext<BlogPosting> {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: input.title,
        description: input.description,
        datePublished: input.pubDate.toISOString(),
        dateModified: (input.updatedDate ?? input.pubDate).toISOString(),
        author: AUTHOR,
        keywords: input.tags.join(', '),
        mainEntityOfPage: input.url,
        ...(input.imageUrl ? { image: input.imageUrl } : {}),
    };
}

export function serializeJsonLd(schema: object): string {
    return JSON.stringify(schema).replace(/</g, '\\u003c').replace(/\//g, '\\/');
}
```

- [ ] **Step 3: Replace inline schema in Post.astro**

Modify `src/layouts/Post.astro`. Replace the current frontmatter block (lines 1-26) and the `<script>` on line 62 with:

Frontmatter (lines 1-14 become):
```typescript
---
import Base from './Base.astro';
import FormattedDate from '../components/FormattedDate.astro';
import Tag from '../components/Tag.astro';
import { absolutePostHref, formatBuildNumber, isBuild, markdownHref, type Post } from '../lib/posts';
import { blogPostingSchema, serializeJsonLd } from '../lib/schema';

interface Props { post: Post }
const { post } = Astro.props;
const { title, description, pubDate, updatedDate, tags } = post.data;
const url = absolutePostHref(post);
const markdownUrl = markdownHref(post);
const buildPrefix = isBuild(post) ? `BUILD ${formatBuildNumber(post.data.number)}` : null;

const schemaJson = serializeJsonLd(blogPostingSchema({
    title,
    description,
    url,
    pubDate,
    updatedDate,
    tags,
}));
---
```

Delete lines 15-26 (the old inline `schema` const). The `<script ... set:html={schemaJson} />` on (now) line 62 stays as-is — it already references `schemaJson`.

- [ ] **Step 4: Add WebSite schema to index.astro**

Modify `src/pages/index.astro`. Add to the frontmatter imports:
```typescript
import { serializeJsonLd, websiteSchema } from '../lib/schema';
```

Add after existing `const` declarations (around line 17):
```typescript
const schemaJson = serializeJsonLd(websiteSchema());
```

Add inside the `<Base>` element, before the closing `</Base>` tag:
```astro
<script is:inline type="application/ld+json" set:html={schemaJson} />
```

- [ ] **Step 5: Add Person schema to about.astro**

Modify `src/pages/about.astro`. Frontmatter becomes:
```typescript
---
import Base from '../layouts/Base.astro';
import { AUTHOR_NAME, PSC_NAME } from '../consts';
import { personSchema, serializeJsonLd } from '../lib/schema';

const schemaJson = serializeJsonLd(personSchema());
---
```

Add inside the `<Base>` element, before the closing `</Base>`:
```astro
<script is:inline type="application/ld+json" set:html={schemaJson} />
```

- [ ] **Step 6: Verify build and types**

```bash
npm run check
```
Expected: `0 errors, 0 warnings, 0 hints`.

```bash
npm run build
```
Expected: build succeeds, `dist/` produced.

Spot-check a built file:
```bash
grep -c 'application/ld+json' dist/index.html dist/about/index.html dist/builds/001-haddrell-from-scratch/index.html
```
Expected: each reports `1`.

- [ ] **Step 7: Validate JSON-LD with Google Rich Results**

Run `npm run preview` in one terminal, visit `http://localhost:4321/builds/001-haddrell-from-scratch/`, view source, copy the JSON-LD block. Paste into `search.google.com/test/rich-results` (Code snippet mode). Expected: `BlogPosting` detected, zero errors. Repeat for home and about pages.

- [ ] **Step 8: Commit and open PR**

```bash
git checkout -b feat/structured-data
git add package.json package-lock.json src/lib/schema.ts src/layouts/Post.astro src/pages/index.astro src/pages/about.astro
git commit -m "feat: add typed JSON-LD helpers and extend to home and about"
git push -u origin feat/structured-data
gh pr create --title "Type-safe JSON-LD with schema-dts" --body "$(cat <<'EOF'
Extracts the existing `BlogPosting` JSON-LD from `Post.astro` into a typed helper in `src/lib/schema.ts` backed by `schema-dts`, and extends structured data to the home (`WebSite`) and about (`Person`) pages.

## Summary
- New `src/lib/schema.ts` exposes `websiteSchema()`, `personSchema()`, `blogPostingSchema()`, and a shared `serializeJsonLd()` (keeps the existing `<`/`/` escaping).
- `schema-dts` (Google's official schema.org types) added as a dev dependency — types-only, zero runtime cost.
- Author metadata (name, url, sameAs) consolidated into one constant, referenced by both Person and BlogPosting.author.
- `image` field on BlogPosting is optional — populated in Phase 4 once per-post OG images exist.

## Test plan
- [ ] `npm run check` reports 0 errors
- [ ] `npm run build` succeeds
- [ ] Validate home / about / build-001 pages in Google Rich Results (BlogPosting, WebSite, Person all recognised)
EOF
)"
```

---

## Phase 4: Per-Post OG Images

**Branch:** `feat/per-post-og`

**Summary:** Generate per-post OG images at build time using `astro-og-canvas` (Satori-backed). Wire them through `BaseHead.astro` and into the BlogPosting `image` field from Phase 3.

**Gotcha:** Satori doesn't support woff2. The site currently uses woff2-only IBM Plex fonts. This phase adds `.ttf` copies specifically for OG generation (separate from the `@fontsource`-style runtime fonts).

**Files:**
- Create: `src/pages/og/[...slug].png.ts`
- Create: `src/assets/fonts/IBMPlexSans-Regular.ttf`
- Create: `src/assets/fonts/IBMPlexSans-SemiBold.ttf`
- Modify: `src/components/BaseHead.astro` (add `ogImage` prop)
- Modify: `src/layouts/Post.astro` (pass per-post OG URL; include in BlogPosting)
- Modify: `package.json` (add `astro-og-canvas`)

- [ ] **Step 1: Install astro-og-canvas**

```bash
npm install astro-og-canvas
```

Expected: `package.json` `dependencies` gains `astro-og-canvas`. Check `github.com/delucis/astro-og-canvas` for the current version at install time — the library is actively maintained by a member of the Astro core team.

- [ ] **Step 2: Download IBM Plex Sans TTF files**

From `github.com/IBM/plex` or Google Fonts. Place:
- `src/assets/fonts/IBMPlexSans-Regular.ttf`
- `src/assets/fonts/IBMPlexSans-SemiBold.ttf`

These live alongside the existing `.woff2` files and are used only by the OG generator, not loaded by the browser.

- [ ] **Step 3: Create the OG endpoint**

Create `src/pages/og/[...slug].png.ts`:

```typescript
import { OGImageRoute } from 'astro-og-canvas';
import { getAllPosts } from '../../lib/posts';
import { SITE_TITLE } from '../../consts';

const posts = await getAllPosts();

const pages = Object.fromEntries(
    posts.map((post) => [
        `${post.collection}/${post.id}`,
        {
            title: post.data.title,
            description: post.data.description,
            tags: post.data.tags,
        },
    ]),
);

export const { getStaticPaths, GET } = OGImageRoute({
    pages,
    param: 'slug',
    getImageOptions: (_path, page) => ({
        title: page.title,
        description: page.description,
        logo: { path: './public/favicon.svg', size: [80] },
        border: { color: [255, 107, 0], width: 6, side: 'inline-start' },
        bgGradient: [[15, 15, 15], [30, 30, 30]],
        padding: 64,
        font: {
            title: { families: ['IBM Plex Sans'], weight: 'SemiBold', size: 64, color: [255, 255, 255] },
            description: { families: ['IBM Plex Sans'], weight: 'Normal', size: 28, color: [200, 200, 200] },
        },
        fonts: [
            './src/assets/fonts/IBMPlexSans-Regular.ttf',
            './src/assets/fonts/IBMPlexSans-SemiBold.ttf',
        ],
    }),
});
```

The generated URLs become `/og/builds/001-haddrell-from-scratch.png`, `/og/essays/<slug>.png`, etc.

- [ ] **Step 4: Add `ogImage` prop to BaseHead.astro**

Modify `src/components/BaseHead.astro`. Replace the `Props` interface (lines 6-12) with:

```typescript
interface Props {
    title: string;
    description: string;
    ogType?: 'website' | 'article';
    ogImage?: string;
    publishedTime?: Date;
    modifiedTime?: Date;
}
```

Replace the destructuring (lines 14-20) with:
```typescript
const {
    title,
    description,
    ogType = 'website',
    ogImage = '/og.png',
    publishedTime,
    modifiedTime,
} = Astro.props;

const ogImageURL = new URL(ogImage, Astro.site);
```

Replace the two `<meta>` tags referencing `/og.png` (lines 53 and 59) with:
```astro
<meta property="og:image" content={ogImageURL} />
```
and
```astro
<meta name="twitter:image" content={ogImageURL} />
```

- [ ] **Step 5: Pass per-post OG URL from Post.astro**

Modify `src/layouts/Post.astro`. Frontmatter (following Phase 3 shape) becomes:

```typescript
---
import Base from './Base.astro';
import FormattedDate from '../components/FormattedDate.astro';
import Tag from '../components/Tag.astro';
import { absolutePostHref, formatBuildNumber, isBuild, markdownHref, type Post } from '../lib/posts';
import { blogPostingSchema, serializeJsonLd } from '../lib/schema';
import { SITE_URL } from '../consts';

interface Props { post: Post }
const { post } = Astro.props;
const { title, description, pubDate, updatedDate, tags } = post.data;
const url = absolutePostHref(post);
const markdownUrl = markdownHref(post);
const buildPrefix = isBuild(post) ? `BUILD ${formatBuildNumber(post.data.number)}` : null;

const ogImagePath = `/og/${post.collection}/${post.id}.png`;
const ogImageUrl = `${SITE_URL}${ogImagePath}`;

const schemaJson = serializeJsonLd(blogPostingSchema({
    title,
    description,
    url,
    pubDate,
    updatedDate,
    tags,
    imageUrl: ogImageUrl,
}));
---
```

Update the `<Base>` invocation (was lines 28-34) to pass `ogImage`:
```astro
<Base
    title={title}
    description={description}
    ogType="article"
    ogImage={ogImagePath}
    publishedTime={pubDate}
    modifiedTime={updatedDate}
>
```

- [ ] **Step 6: Verify types and build**

```bash
npm run check
```
Expected: `0 errors`.

```bash
npm run build
```
Expected: build succeeds. During build, astro-og-canvas logs lines like `generating /og/builds/001-haddrell-from-scratch.png`.

```bash
ls dist/og/builds/ dist/og/essays/
```
Expected: one PNG per post.

- [ ] **Step 7: Visual verification**

```bash
npm run preview
```
In a browser:
- Visit `http://localhost:4321/og/builds/001-haddrell-from-scratch.png` — confirm the rendered image shows the post title and description on a dark card with the orange accent border.
- Visit `http://localhost:4321/builds/001-haddrell-from-scratch/`, view source, confirm `<meta property="og:image" content="https://www.haddrell.co.uk/og/builds/001-haddrell-from-scratch.png">` is present.
- Visit `http://localhost:4321/about/`, view source, confirm `og:image` is still `/og.png` (default) — only posts get per-post images.

- [ ] **Step 8: Commit and open PR**

```bash
git checkout -b feat/per-post-og
git add package.json package-lock.json src/pages/og/ src/assets/fonts/IBMPlexSans-Regular.ttf src/assets/fonts/IBMPlexSans-SemiBold.ttf src/components/BaseHead.astro src/layouts/Post.astro
git commit -m "feat: generate per-post OG images at build time"
git push -u origin feat/per-post-og
gh pr create --title "Per-post Open Graph images" --body "$(cat <<'EOF'
Replaces the single shared OG thumbnail with per-post images generated at build time via astro-og-canvas (Satori-backed). Each post gets a card at /og/<collection>/<slug>.png, referenced by both the og:image meta tag and the BlogPosting JSON-LD image field.

## Summary
- New `src/pages/og/[...slug].png.ts` endpoint emits one PNG per essay/build at build time — static output, no runtime dependency on the Worker.
- `src/assets/fonts/IBMPlexSans-*.ttf` added (Satori rejects woff2; these are used only by the OG generator).
- `BaseHead.astro` gains an `ogImage?: string` prop, defaulting to `/og.png`. Non-post pages (home, about, listings) still use the shared image.
- `Post.astro` passes `ogImage` to BaseHead and the absolute URL to `blogPostingSchema` (populates the previously-empty `image` field).

## Test plan
- [ ] `npm run check` reports 0 errors
- [ ] `npm run build` emits one PNG per post in `dist/og/`
- [ ] Preview URL: each post page has a unique og:image, home/about still use the shared image
- [ ] opengraph.xyz preview of the merged site shows per-post cards
EOF
)"
```

---

## Phase 5: Accessibility CI with pa11y-ci

**Branch:** `feat/a11y-ci`

**Summary:** Run pa11y-ci against every URL in the built sitemap on PRs. Scales automatically as posts accumulate — no per-post config.

**Files:**
- Create: `.github/workflows/a11y.yml`
- Create: `.pa11yci.json`
- Modify: `package.json` (add `pa11y-ci` and `serve` dev deps)

- [ ] **Step 1: Install pa11y-ci and a static server**

```bash
npm install --save-dev pa11y-ci serve
```

`serve` is a minimal static file server used only in CI to host `dist/` on localhost while pa11y-ci runs against it. Lighter than spinning up `astro preview`.

- [ ] **Step 2: Create `.pa11yci.json`**

```json
{
    "defaults": {
        "standard": "WCAG2AA",
        "timeout": 30000,
        "wait": 500,
        "chromeLaunchConfig": {
            "args": ["--no-sandbox", "--disable-dev-shm-usage"]
        },
        "ignore": []
    }
}
```

No URLs listed — the workflow discovers them via `--sitemap` against the locally-served `dist/sitemap-index.xml`.

- [ ] **Step 3: Create the a11y workflow**

Create `.github/workflows/a11y.yml`:

```yaml
name: Accessibility

on:
    pull_request:
        paths:
            - 'src/**'
            - 'public/**'
            - 'astro.config.mjs'
            - 'package.json'
            - 'package-lock.json'
            - '.pa11yci.json'
            - '.github/workflows/a11y.yml'

jobs:
    pa11y:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: '22'
                  cache: npm
            - run: npm ci
            - run: npm run build
            - name: Serve dist/
              run: npx serve dist -p 4321 -L &
            - name: Wait for server
              run: npx wait-on http://localhost:4321/sitemap-index.xml --timeout 30000
            - name: Run pa11y-ci against sitemap
              run: npx pa11y-ci --sitemap http://localhost:4321/sitemap-index.xml --config .pa11yci.json
```

`serve -L` disables its request logs so CI output stays focused on pa11y results. `wait-on` is transitively available via `serve`'s deps; install it explicitly if not:
```bash
npm install --save-dev wait-on
```

- [ ] **Step 4: Run pa11y-ci locally against the current site**

```bash
npm run build
```
In a separate terminal:
```bash
npx serve dist -p 4321
```
Back in the original terminal:
```bash
npx pa11y-ci --sitemap http://localhost:4321/sitemap-index.xml --config .pa11yci.json
```

Expected: results for every URL in the sitemap, with a summary line like `✔ N/N URLs passed`.

**If issues are reported:** fix them before proceeding. Common fixes:
- Missing `alt` text on images → edit the relevant `.md`/`.astro`
- Heading order violations (e.g. `h1` → `h3`) → fix structure
- Low colour contrast → adjust CSS variables in `src/styles/global.css`
- Colour contrast on focused elements → check `:focus-visible` styles

If a finding is genuinely a false positive and not a real a11y issue, add its rule code to `"ignore": [...]` in `.pa11yci.json` with a comment explaining why (via a sibling `_comment` field, since JSON doesn't support comments natively — or convert config to `.pa11yci.js` if notes get long).

- [ ] **Step 5: Verify workflow parses**

```bash
npx -y action-validator@latest .github/workflows/a11y.yml
```
Expected: passes schema validation.

- [ ] **Step 6: Commit and open PR**

```bash
git checkout -b feat/a11y-ci
git add package.json package-lock.json .pa11yci.json .github/workflows/a11y.yml
git commit -m "feat: add pa11y-ci accessibility checks to CI"
git push -u origin feat/a11y-ci
gh pr create --title "Accessibility checks via pa11y-ci" --body "$(cat <<'EOF'
Adds WCAG 2.0 AA accessibility checks on every PR, driven by the built sitemap so coverage scales automatically as posts accumulate — no per-post config.

## Summary
- New workflow `.github/workflows/a11y.yml` builds the site, serves `dist/` via `serve` on localhost, and runs `pa11y-ci --sitemap` against it.
- `.pa11yci.json` sets the WCAG2AA standard; `ignore` is empty (nothing suppressed yet).
- Dev deps added: `pa11y-ci`, `serve`, `wait-on`.

## Test plan
- [ ] This PR's a11y workflow passes
- [ ] Manually introduce a breaking change (e.g. remove alt text from `public/dougal.svg` reference) on a throwaway branch and confirm the workflow fails as expected, then revert
EOF
)"
```

- [ ] **Step 7: Verify workflow runs on the PR**

After pushing, check `gh pr checks` — expect `Accessibility / pa11y` to appear. If green, proceed to merge.

If red: the workflow found real issues. Fix in the same PR rather than disabling checks. Re-run `gh run watch` until green.

---

## Self-Review Checklist

Run through before execution.

**Spec coverage:**
- [x] Gap 1 (per-post OG) → Phase 4
- [x] Gap 2 (link checker) → Phase 2
- [x] Addition 1 (a11y CI) → Phase 5
- [x] Addition 2 (JSON-LD) → Phase 3
- [x] Addition 3 (PR preview deploys) → Phase 1

**Placeholder scan:** No "TODO", "TBD", "fill in details", or "similar to above" patterns. Every step names the exact file, shows the exact code, and includes the exact command with expected output.

**Type consistency:**
- `blogPostingSchema` input type `BlogPostingInput` is defined in `src/lib/schema.ts` (Phase 3 Step 2) and used in Post.astro (Phase 3 Step 3, Phase 4 Step 5) with matching field names: `title, description, url, pubDate, updatedDate, tags, imageUrl`.
- `BaseHead` `Props.ogImage` is a `string` (Phase 4 Step 4); `Post.astro` passes `ogImagePath` which is a `string` built from template literal.
- Sitemap URL path is `/sitemap-index.xml` — consistent with `BaseHead.astro:39` and `@astrojs/sitemap` default output.

**Branch protection / PR workflow:**
- All 5 phases land as PRs — honours the user's "default to PR workflow on protected branches" feedback memory.
- Phase 1 closes without merging (verification-only); Phases 2-5 merge individually.

---

## Execution Handoff

Two ways to run this:

1. **Subagent-Driven (recommended for multi-day work):** dispatch a fresh subagent per phase, review the diff before merge, low context cost. Uses `superpowers:subagent-driven-development`.

2. **Inline Execution:** work through phases in the current session with checkpoints between phases. Uses `superpowers:executing-plans`. Fine for a focused session.

For a personal blog with 5 small phases, inline execution is likely the right call — fewer handoffs, preview URLs give visual feedback between phases.
