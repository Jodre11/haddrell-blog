# Haddrell Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v1 of www.haddrell.co.uk — an editorial personal blog for Christian Haddrell, built on Astro, deployed via Cloudflare Pages, with dark mode, client-side search (Pagefind), and first-class agent-readability (llms.txt, .md companions, JSON-LD).

**Architecture:** Static Astro site. Two content collections (`essays`, `builds`) backed by Markdown/MDX files. Editorial layout with IBM Plex Sans/Mono, `#fe0000` accent, light/dark palette driven by CSS custom properties on `[data-theme]`. Pagefind indexes at build time for client-side search. LLM-readable companions generated from the same content sources.

**Tech Stack:** Astro 6, `@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap`, Astro built-in fonts provider (local IBM Plex woff2), Pagefind, Cloudflare Pages.

**Design spec:** `docs/superpowers/specs/2026-04-16-haddrell-blog-design.md`

---

## File Structure

### Created

- `src/content/essays/` — essay Markdown files
- `src/content/builds/` — build Markdown files
- `src/assets/fonts/` — IBM Plex Sans/Mono woff2 files
- `src/components/Dougal.astro` — inline SVG component
- `src/components/ThemeToggle.astro` — dark/light/auto toggle + script
- `src/components/Search.astro` — Pagefind UI host
- `src/components/Tag.astro` — single-tag chip
- `src/components/PostCard.astro` — title + date + tags card used on indexes
- `src/layouts/Base.astro` — html/body shell used by all pages
- `src/layouts/Post.astro` — article layout with JSON-LD (replaces `BlogPost.astro`)
- `src/pages/essays/index.astro`
- `src/pages/essays/[slug].astro`
- `src/pages/essays/[slug].md.ts` — Markdown companion
- `src/pages/builds/index.astro`
- `src/pages/builds/[slug].astro`
- `src/pages/builds/[slug].md.ts` — Markdown companion
- `src/pages/tags/[tag].astro`
- `src/pages/llms.txt.ts` — LLM index
- `src/pages/llms-full.txt.ts` — concatenated Markdown
- `src/lib/posts.ts` — helper for combined essay+build retrieval
- `src/content/essays/the-adoption-gap.md` — launch essay placeholder
- `src/content/builds/001-haddrell-from-scratch.md` — launch build placeholder

### Modified

- `astro.config.mjs` — site URL, fonts, Pagefind integration
- `package.json` — add pagefind dependency
- `src/consts.ts` — real site metadata
- `src/content.config.ts` — two collections with tag schema
- `src/components/BaseHead.astro` — canonical meta + OG + fonts + theme bootstrap
- `src/components/Header.astro` — wordmark + nav + theme toggle + search
- `src/components/Footer.astro` — Dougal colophon + Dougal Debug Limited + links
- `src/components/FormattedDate.astro` — `15 Apr 2026` format
- `src/styles/global.css` — full editorial restyle with CSS variables for dark mode
- `src/pages/index.astro` — editorial homepage
- `src/pages/about.astro` — short authored about
- `src/pages/rss.xml.js` — both collections, full content

### Deleted

- `src/content/blog/*` (all sample posts)
- `src/pages/blog/[...slug].astro`
- `src/pages/blog/index.astro`
- `src/layouts/BlogPost.astro` (replaced by `Post.astro`)
- `src/components/HeaderLink.astro` (replaced by plain `<a>` in new Header)
- `src/assets/fonts/atkinson-*.woff`
- `src/assets/blog-placeholder-*.jpg` (unused after restyle)

---

## Phase 1 — Foundation

### Task 1: Project metadata and site URL

**Files:**
- Modify: `src/consts.ts`
- Modify: `astro.config.mjs`
- Modify: `package.json`

- [ ] **Step 1: Rewrite `src/consts.ts`**

```ts
export const SITE_TITLE = 'Christian Haddrell';
export const SITE_SHORT = 'Haddrell';
export const SITE_DESCRIPTION = 'Product engineering, with receipts.';
export const SITE_URL = 'https://www.haddrell.co.uk';
export const AUTHOR_NAME = 'Christian Haddrell';
export const PSC_NAME = 'Dougal Debug Limited';
```

- [ ] **Step 2: Update `astro.config.mjs`** — set `site`, drop Atkinson, leave fonts block empty for now (added in Task 2).

```js
// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://www.haddrell.co.uk',
    integrations: [
        mdx(),
        sitemap(),
    ],
});
```

- [ ] **Step 3: Verify build still works**

Run: `npm run build`
Expected: completes without error (existing blog content still builds).

- [ ] **Step 4: Commit**

```bash
git add src/consts.ts astro.config.mjs
git commit -m "Set real site metadata and URL"
```

---

### Task 2: Install IBM Plex fonts and wire up font variables

**Files:**
- Create: `src/assets/fonts/IBMPlexSans-Regular.woff2`
- Create: `src/assets/fonts/IBMPlexSans-SemiBold.woff2`
- Create: `src/assets/fonts/IBMPlexSans-Italic.woff2`
- Create: `src/assets/fonts/IBMPlexMono-Regular.woff2`
- Create: `src/assets/fonts/IBMPlexMono-SemiBold.woff2`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Download IBM Plex woff2 files**

Download from `https://github.com/IBM/plex/tree/master/packages/plex-sans/fonts/complete/woff2` and `.../plex-mono/fonts/complete/woff2`. Save only the five weights listed above into `src/assets/fonts/`.

- [ ] **Step 2: Remove Atkinson files**

```bash
rm src/assets/fonts/atkinson-regular.woff src/assets/fonts/atkinson-bold.woff
```

- [ ] **Step 3: Update `astro.config.mjs` fonts block**

```js
// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
    site: 'https://www.haddrell.co.uk',
    integrations: [mdx(), sitemap()],
    fonts: [
        {
            provider: fontProviders.local(),
            name: 'IBM Plex Sans',
            cssVariable: '--font-sans',
            fallbacks: ['system-ui', 'sans-serif'],
            options: {
                variants: [
                    { src: ['./src/assets/fonts/IBMPlexSans-Regular.woff2'], weight: 400, style: 'normal', display: 'swap' },
                    { src: ['./src/assets/fonts/IBMPlexSans-Italic.woff2'], weight: 400, style: 'italic', display: 'swap' },
                    { src: ['./src/assets/fonts/IBMPlexSans-SemiBold.woff2'], weight: 600, style: 'normal', display: 'swap' },
                ],
            },
        },
        {
            provider: fontProviders.local(),
            name: 'IBM Plex Mono',
            cssVariable: '--font-mono',
            fallbacks: ['ui-monospace', 'monospace'],
            options: {
                variants: [
                    { src: ['./src/assets/fonts/IBMPlexMono-Regular.woff2'], weight: 400, style: 'normal', display: 'swap' },
                    { src: ['./src/assets/fonts/IBMPlexMono-SemiBold.woff2'], weight: 600, style: 'normal', display: 'swap' },
                ],
            },
        },
    ],
});
```

- [ ] **Step 4: Update `src/components/BaseHead.astro`** — replace Atkinson `<Font>` preload with Plex Sans/Mono (leave the rest of the file until Task 8):

In `BaseHead.astro`, replace:

```astro
<Font cssVariable="--font-atkinson" preload />
```

with:

```astro
<Font cssVariable="--font-sans" preload />
<Font cssVariable="--font-mono" />
```

- [ ] **Step 5: Verify build succeeds**

Run: `npm run build`
Expected: completes without font errors.

- [ ] **Step 6: Commit**

```bash
git add src/assets/fonts astro.config.mjs src/components/BaseHead.astro
git commit -m "Swap Atkinson for IBM Plex Sans/Mono"
```

---

### Task 3: Rewrite global.css with editorial palette and dark mode variables

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace `src/styles/global.css` entirely**

```css
:root {
    --bg: #ffffff;
    --fg: #111111;
    --fg-muted: #555555;
    --accent: #fe0000;
    --hairline: rgba(17, 17, 17, 0.10);
    --code-bg: #f4f4f4;
    --max-measure: 68ch;
    --container: 960px;
}

[data-theme='dark'] {
    --bg: #111111;
    --fg: #e8e8e8;
    --fg-muted: #a0a0a0;
    --accent: #fe0000;
    --hairline: rgba(232, 232, 232, 0.12);
    --code-bg: #1a1a1a;
}

@media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
        --bg: #111111;
        --fg: #e8e8e8;
        --fg-muted: #a0a0a0;
        --hairline: rgba(232, 232, 232, 0.12);
        --code-bg: #1a1a1a;
    }
}

* { box-sizing: border-box; }

html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: var(--font-sans), system-ui, sans-serif;
    font-size: 18px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
}

main {
    max-width: var(--container);
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
}

h1, h2, h3, h4 {
    font-family: var(--font-sans);
    font-weight: 600;
    line-height: 1.15;
    margin: 0 0 0.5em;
    color: var(--fg);
}

h1 { font-size: 2.25rem; letter-spacing: -0.01em; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.2rem; }

p, li { max-width: var(--max-measure); }
p { margin: 0 0 1.1em; }

a {
    color: var(--fg);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.2em;
}
a:hover { color: var(--accent); }

hr {
    border: none;
    border-top: 1px solid var(--hairline);
    margin: 2rem 0;
}

code {
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 0.92em;
    background: var(--code-bg);
    padding: 0.1em 0.35em;
    border-radius: 2px;
}

pre {
    font-family: var(--font-mono), ui-monospace, monospace;
    background: var(--code-bg);
    padding: 1rem 1.25rem;
    overflow-x: auto;
    border-radius: 2px;
    line-height: 1.5;
}
pre code { background: transparent; padding: 0; }

blockquote {
    border-left: 2px solid var(--accent);
    margin: 1.5rem 0;
    padding: 0 0 0 1rem;
    color: var(--fg-muted);
}

img { max-width: 100%; height: auto; }

.muted { color: var(--fg-muted); }
.mono { font-family: var(--font-mono), ui-monospace, monospace; }

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

@media (max-width: 720px) {
    body { font-size: 17px; }
    h1 { font-size: 1.85rem; }
}
```

- [ ] **Step 2: Build and start dev server**

Run: `npm run dev`
Open `http://localhost:4321/`.
Expected: text renders in IBM Plex Sans. Homepage looks unstyled-ish but functional — template chrome still has its own inline styles.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "Replace Bear Blog CSS with editorial palette"
```

---

### Task 4: Theme toggle component

**Files:**
- Create: `src/components/ThemeToggle.astro`
- Modify: `src/components/BaseHead.astro` (add inline theme bootstrap)

- [ ] **Step 1: Create `src/components/ThemeToggle.astro`**

```astro
---
---
<button id="theme-toggle" type="button" aria-label="Toggle theme" title="Toggle theme">
    <span class="theme-icon" data-icon="auto" aria-hidden="true">A</span>
    <span class="theme-icon" data-icon="light" aria-hidden="true">L</span>
    <span class="theme-icon" data-icon="dark" aria-hidden="true">D</span>
    <span class="sr-only">Toggle theme</span>
</button>
<style>
    #theme-toggle {
        border: 1px solid var(--hairline);
        background: transparent;
        color: var(--fg);
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        line-height: 1;
    }
    #theme-toggle:hover { border-color: var(--accent); color: var(--accent); }
    .theme-icon { display: none; }
    [data-theme-pref='auto']  .theme-icon[data-icon='auto']  { display: inline; }
    [data-theme-pref='light'] .theme-icon[data-icon='light'] { display: inline; }
    [data-theme-pref='dark']  .theme-icon[data-icon='dark']  { display: inline; }
</style>
<script is:inline>
(function () {
    const root = document.documentElement;
    const pref = localStorage.getItem('theme-pref') || 'auto';
    root.setAttribute('data-theme-pref', pref);
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const cur = root.getAttribute('data-theme-pref') || 'auto';
        const next = cur === 'auto' ? 'light' : cur === 'light' ? 'dark' : 'auto';
        localStorage.setItem('theme-pref', next);
        root.setAttribute('data-theme-pref', next);
        if (next === 'auto') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', next);
        }
    });
})();
</script>
```

- [ ] **Step 2: Add inline theme bootstrap to `BaseHead.astro`**

Insert after `<meta name="viewport" ...>` and before `<link rel="icon" ...>`:

```astro
<script is:inline>
(function () {
    try {
        const pref = localStorage.getItem('theme-pref') || 'auto';
        const root = document.documentElement;
        root.setAttribute('data-theme-pref', pref);
        if (pref === 'light' || pref === 'dark') {
            root.setAttribute('data-theme', pref);
        }
    } catch (e) { /* ignore */ }
})();
</script>
```

- [ ] **Step 3: Verify no FOUC**

Run: `npm run dev`
Hard-refresh with DevTools "Disable cache" and throttle to Slow 3G. Set pref to `dark` via toggle (added in Task 9) — once the toggle exists, verify the page loads already dark with no white flash. (Until Task 9 the toggle doesn't exist; skip interactive check and just verify the inline script is present in page source.)

- [ ] **Step 4: Commit**

```bash
git add src/components/ThemeToggle.astro src/components/BaseHead.astro
git commit -m "Add theme toggle and inline bootstrap"
```

---

## Phase 2 — Content Model

### Task 5: Redefine content collections

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/lib/posts.ts`

- [ ] **Step 1: Replace `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const postFields = {
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
};

const essays = defineCollection({
    loader: glob({ base: './src/content/essays', pattern: '**/*.{md,mdx}' }),
    schema: () => z.object(postFields),
});

const builds = defineCollection({
    loader: glob({ base: './src/content/builds', pattern: '**/*.{md,mdx}' }),
    schema: () => z.object({
        ...postFields,
        number: z.number().int().positive(),
    }),
});

export const collections = { essays, builds };
```

- [ ] **Step 2: Create `src/lib/posts.ts`**

```ts
import { getCollection, type CollectionEntry } from 'astro:content';

export type Essay = CollectionEntry<'essays'>;
export type Build = CollectionEntry<'builds'>;
export type Post = Essay | Build;

const notDraft = (p: Post) => import.meta.env.DEV || !p.data.draft;

export async function getEssays(): Promise<Essay[]> {
    const items = await getCollection('essays');
    return items.filter(notDraft).sort(byPubDateDesc);
}

export async function getBuilds(): Promise<Build[]> {
    const items = await getCollection('builds');
    return items.filter(notDraft).sort(byPubDateDesc);
}

export async function getAllPosts(): Promise<Post[]> {
    const [e, b] = await Promise.all([getEssays(), getBuilds()]);
    return [...e, ...b].sort(byPubDateDesc);
}

export function postHref(p: Post): string {
    return isBuild(p) ? `/builds/${p.id}/` : `/essays/${p.id}/`;
}

export function isBuild(p: Post): p is Build {
    return 'number' in p.data;
}

function byPubDateDesc(a: Post, b: Post): number {
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}

export async function getAllTags(): Promise<string[]> {
    const posts = await getAllPosts();
    const set = new Set<string>();
    for (const p of posts) for (const t of p.data.tags) set.add(t);
    return [...set].sort();
}
```

- [ ] **Step 3: Delete the old `blog` collection content**

```bash
rm -rf src/content/blog
mkdir -p src/content/essays src/content/builds
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx astro check`
Expected: collection errors only in files still referencing `'blog'` — we'll fix those in later tasks. Confirm no errors in `content.config.ts` or `src/lib/posts.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/lib/posts.ts
git rm -r src/content/blog
git commit -m "Redefine content collections as essays and builds"
```

---

### Task 6: Seed content

**Files:**
- Create: `src/content/essays/the-adoption-gap.md`
- Create: `src/content/builds/001-haddrell-from-scratch.md`

- [ ] **Step 1: Create launch essay placeholder**

`src/content/essays/the-adoption-gap.md`:

```markdown
---
title: "The adoption gap"
description: "Why senior engineers who adopt agentic tooling early will out-ship those who don't — and why the gap will widen."
pubDate: 2026-04-16
tags: ["agentic-tools", "process"]
draft: true
---

Placeholder. This is the launch essay. Replace before publishing.
```

- [ ] **Step 2: Create first build writeup**

`src/content/builds/001-haddrell-from-scratch.md`:

```markdown
---
title: "Haddrell from scratch"
description: "Building this blog: Astro, Cloudflare Pages, Pagefind, and an LLM-friendly content surface."
pubDate: 2026-04-16
number: 1
tags: ["astro", "cloudflare", "meta"]
draft: true
---

Placeholder. Swap out for the real write-up before publishing.
```

- [ ] **Step 3: Commit**

```bash
git add src/content/essays src/content/builds
git commit -m "Add seed essay and build placeholders"
```

---

## Phase 3 — Layouts & Components

### Task 7: Rewrite FormattedDate (UK format)

**Files:**
- Modify: `src/components/FormattedDate.astro`

- [ ] **Step 1: Replace file contents**

```astro
---
interface Props {
    date: Date;
}
const { date } = Astro.props;
const formatted = date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
}).replace(',', '');
---
<time datetime={date.toISOString()} class="mono">{formatted}</time>
```

- [ ] **Step 2: Verify on a page that still renders (the build may still be broken) — skip interactive check; just `npm run build` and resolve later.**

- [ ] **Step 3: Commit**

```bash
git add src/components/FormattedDate.astro
git commit -m "Format dates as UK 15 Apr 2026"
```

---

### Task 8: Rewrite BaseHead

**Files:**
- Modify: `src/components/BaseHead.astro`

- [ ] **Step 1: Replace `src/components/BaseHead.astro`**

```astro
---
import '../styles/global.css';
import { Font } from 'astro:assets';
import { SITE_TITLE } from '../consts';

interface Props {
    title: string;
    description: string;
    ogType?: 'website' | 'article';
    publishedTime?: Date;
    modifiedTime?: Date;
}

const {
    title,
    description,
    ogType = 'website',
    publishedTime,
    modifiedTime,
} = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<script is:inline>
(function () {
    try {
        const pref = localStorage.getItem('theme-pref') || 'auto';
        const root = document.documentElement;
        root.setAttribute('data-theme-pref', pref);
        if (pref === 'light' || pref === 'dark') {
            root.setAttribute('data-theme', pref);
        }
    } catch (e) { /* ignore */ }
})();
</script>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" href="/favicon.ico" />
<link rel="sitemap" href="/sitemap-index.xml" />
<link rel="alternate" type="application/rss+xml" title={SITE_TITLE} href={new URL('rss.xml', Astro.site)} />
<link rel="canonical" href={canonicalURL} />
<meta name="generator" content={Astro.generator} />
<Font cssVariable="--font-sans" preload />
<Font cssVariable="--font-mono" />
<title>{title}</title>
<meta name="title" content={title} />
<meta name="description" content={description} />
<meta property="og:type" content={ogType} />
<meta property="og:url" content={Astro.url} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:site_name" content={SITE_TITLE} />
{publishedTime && <meta property="article:published_time" content={publishedTime.toISOString()} />}
{modifiedTime && <meta property="article:modified_time" content={modifiedTime.toISOString()} />}
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
```

- [ ] **Step 2: Delete unused fallback images**

```bash
rm -f src/assets/blog-placeholder-*.jpg
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: may fail in pages that still reference `BlogPost` layout with hero images — fix in later tasks.

- [ ] **Step 4: Commit**

```bash
git add src/components/BaseHead.astro
git rm -f src/assets/blog-placeholder-*.jpg
git commit -m "Rewrite BaseHead for editorial metadata and OG article tags"
```

---

### Task 9: Rewrite Header (wordmark, nav, theme toggle, search slot)

**Files:**
- Modify: `src/components/Header.astro`
- Delete: `src/components/HeaderLink.astro`

- [ ] **Step 1: Replace `src/components/Header.astro`**

```astro
---
import { SITE_TITLE } from '../consts';
import ThemeToggle from './ThemeToggle.astro';
---
<header class="site-header">
    <div class="bar">
        <a class="wordmark" href="/">{SITE_TITLE}</a>
        <nav aria-label="Primary">
            <a href="/essays/">Essays</a>
            <a href="/builds/">Builds</a>
            <a href="/about/">About</a>
        </nav>
        <div class="actions">
            <a class="feed" href="/rss.xml" aria-label="RSS feed">RSS</a>
            <ThemeToggle />
        </div>
    </div>
</header>
<style>
    .site-header {
        border-bottom: 1px solid var(--hairline);
        background: var(--bg);
    }
    .bar {
        max-width: var(--container);
        margin: 0 auto;
        padding: 1rem 1.25rem;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: baseline;
        gap: 1.5rem;
    }
    .wordmark {
        font-weight: 600;
        font-size: 1.1rem;
        text-decoration: none;
        letter-spacing: -0.01em;
    }
    nav { display: flex; gap: 1.25rem; }
    nav a {
        text-decoration: none;
        color: var(--fg-muted);
        font-size: 0.95rem;
    }
    nav a:hover, nav a[aria-current='page'] { color: var(--fg); }
    .actions { display: flex; align-items: center; gap: 0.75rem; }
    .feed {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 0.8rem;
        color: var(--fg-muted);
        text-decoration: none;
    }
    .feed:hover { color: var(--accent); }
    @media (max-width: 640px) {
        .bar { grid-template-columns: 1fr auto; row-gap: 0.5rem; }
        nav { grid-column: 1 / -1; order: 3; }
    }
</style>
```

- [ ] **Step 2: Delete `HeaderLink.astro`**

```bash
rm src/components/HeaderLink.astro
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.astro
git rm src/components/HeaderLink.astro
git commit -m "Rewrite Header with wordmark, nav, and theme toggle"
```

---

### Task 10: Dougal SVG component and Footer

**Files:**
- Create: `src/components/Dougal.astro`
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Create `src/components/Dougal.astro`**

This inlines `public/dougal.svg` so the mark scales cleanly and inherits no external CSS. Rather than duplicate the SVG source, read it from the public file at build time.

```astro
---
import fs from 'node:fs/promises';
import path from 'node:path';

interface Props {
    size?: number;
    class?: string;
}
const { size = 48, class: className } = Astro.props;
const svgPath = path.resolve(process.cwd(), 'public/dougal.svg');
const raw = await fs.readFile(svgPath, 'utf8');
const sized = raw
    .replace(/\swidth="[^"]*"/, '')
    .replace(/\sheight="[^"]*"/, '')
    .replace('<svg ', `<svg width="${size}" height="${size}" ${className ? `class="${className}" ` : ''}aria-hidden="true" focusable="false" `);
---
<Fragment set:html={sized} />
```

- [ ] **Step 2: Replace `src/components/Footer.astro`**

```astro
---
import Dougal from './Dougal.astro';
import { PSC_NAME } from '../consts';
const year = new Date().getFullYear();
---
<footer class="site-footer">
    <div class="inner">
        <div class="colophon">
            <Dougal size={40} />
            <div>
                <div class="mono">&copy; {year} {PSC_NAME}</div>
                <div class="muted">Company No. 15099832 · Registered in England &amp; Wales</div>
            </div>
        </div>
        <nav aria-label="Footer">
            <a href="/rss.xml">RSS</a>
            <a href="/sitemap-index.xml">Sitemap</a>
            <a href="/llms.txt">llms.txt</a>
        </nav>
    </div>
</footer>
<style>
    .site-footer {
        border-top: 1px solid var(--hairline);
        margin-top: 4rem;
    }
    .inner {
        max-width: var(--container);
        margin: 0 auto;
        padding: 2rem 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 2rem;
        flex-wrap: wrap;
    }
    .colophon { display: flex; align-items: center; gap: 0.9rem; }
    .colophon .mono { font-family: var(--font-mono), ui-monospace, monospace; font-size: 0.85rem; }
    .colophon .muted { font-size: 0.8rem; }
    nav { display: flex; gap: 1rem; }
    nav a {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 0.8rem;
        color: var(--fg-muted);
        text-decoration: none;
    }
    nav a:hover { color: var(--accent); }
</style>
```

- [ ] **Step 3: Check/confirm the company number**

Confirm Christian's actual Companies House number before committing. If unknown, replace the hardcoded `15099832` line with just `Registered in England & Wales` and remove the company number.

- [ ] **Step 4: Commit**

```bash
git add src/components/Dougal.astro src/components/Footer.astro
git commit -m "Add Dougal colophon and footer"
```

---

### Task 11: Base layout and Post layout

**Files:**
- Create: `src/layouts/Base.astro`
- Create: `src/layouts/Post.astro`
- Delete: `src/layouts/BlogPost.astro`

- [ ] **Step 1: Create `src/layouts/Base.astro`**

```astro
---
import BaseHead from '../components/BaseHead.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props {
    title: string;
    description: string;
    ogType?: 'website' | 'article';
    publishedTime?: Date;
    modifiedTime?: Date;
}
const props = Astro.props;
---
<!doctype html>
<html lang="en-GB">
    <head>
        <BaseHead {...props} />
    </head>
    <body>
        <Header />
        <main><slot /></main>
        <Footer />
    </body>
</html>
```

- [ ] **Step 2: Create `src/layouts/Post.astro`**

```astro
---
import Base from './Base.astro';
import FormattedDate from '../components/FormattedDate.astro';
import { SITE_URL, AUTHOR_NAME } from '../consts';

interface Props {
    title: string;
    description: string;
    pubDate: Date;
    updatedDate?: Date;
    tags: string[];
    kind: 'essay' | 'build';
    number?: number;
    slug: string;
}
const { title, description, pubDate, updatedDate, tags, kind, number, slug } = Astro.props;
const url = `${SITE_URL}/${kind === 'essay' ? 'essays' : 'builds'}/${slug}/`;
const markdownUrl = `${url.replace(/\/$/, '')}.md`;

const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: pubDate.toISOString(),
    dateModified: (updatedDate ?? pubDate).toISOString(),
    author: { '@type': 'Person', name: AUTHOR_NAME },
    keywords: tags.join(', '),
    mainEntityOfPage: url,
};
---
<Base
    title={title}
    description={description}
    ogType="article"
    publishedTime={pubDate}
    modifiedTime={updatedDate}
>
    <article>
        <header class="post-header">
            <div class="meta">
                <FormattedDate date={pubDate} />
                {kind === 'build' && number && <span class="num mono">BUILD {String(number).padStart(3, '0')}</span>}
            </div>
            <h1>{title}</h1>
            {description && <p class="lede">{description}</p>}
            {tags.length > 0 && (
                <p class="tags">
                    {tags.map((t) => (
                        <a href={`/tags/${t}/`} class="tag">#{t}</a>
                    ))}
                </p>
            )}
            {updatedDate && (
                <p class="updated muted">Updated <FormattedDate date={updatedDate} /></p>
            )}
        </header>
        <hr />
        <div class="prose">
            <slot />
        </div>
        <footer class="post-footer">
            <p class="muted">
                <a href={markdownUrl}>View this post as Markdown</a>
            </p>
        </footer>
    </article>
    <script type="application/ld+json" set:html={JSON.stringify(schema)} />
</Base>
<style>
    .post-header .meta {
        font-family: var(--font-mono), ui-monospace, monospace;
        color: var(--fg-muted);
        font-size: 0.85rem;
        display: flex;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
    }
    .post-header h1 { margin-top: 0; }
    .lede { font-size: 1.15rem; color: var(--fg-muted); }
    .tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0 0; }
    .tag {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 0.8rem;
        color: var(--fg-muted);
        text-decoration: none;
        border: 1px solid var(--hairline);
        padding: 0.1em 0.5em;
    }
    .tag:hover { color: var(--accent); border-color: var(--accent); }
    .updated { font-size: 0.85rem; }
    .prose :global(h2) { margin-top: 2rem; }
    .prose :global(h3) { margin-top: 1.5rem; }
    .post-footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--hairline); }
</style>
```

- [ ] **Step 3: Delete the old layout**

```bash
rm src/layouts/BlogPost.astro
```

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Base.astro src/layouts/Post.astro
git rm src/layouts/BlogPost.astro
git commit -m "Add Base and Post layouts with JSON-LD"
```

---

### Task 12: PostCard component for indexes

**Files:**
- Create: `src/components/PostCard.astro`

- [ ] **Step 1: Create `src/components/PostCard.astro`**

```astro
---
import FormattedDate from './FormattedDate.astro';
import { postHref, isBuild, type Post } from '../lib/posts';

interface Props { post: Post }
const { post } = Astro.props;
const href = postHref(post);
const prefix = isBuild(post) && post.data.number
    ? `BUILD ${String(post.data.number).padStart(3, '0')}`
    : null;
---
<article class="card">
    <a href={href}>
        <div class="meta">
            <FormattedDate date={post.data.pubDate} />
            {prefix && <span class="num mono">{prefix}</span>}
        </div>
        <h3 class="title">{post.data.title}</h3>
        <p class="desc">{post.data.description}</p>
        {post.data.tags.length > 0 && (
            <p class="tags">
                {post.data.tags.map((t) => <span class="tag">#{t}</span>)}
            </p>
        )}
    </a>
</article>
<style>
    .card { padding: 1rem 0; border-bottom: 1px solid var(--hairline); }
    .card a { display: block; text-decoration: none; color: inherit; }
    .card:hover .title { color: var(--accent); }
    .meta {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 0.8rem;
        color: var(--fg-muted);
        display: flex;
        gap: 0.75rem;
        margin-bottom: 0.25rem;
    }
    .title { margin: 0 0 0.25rem; font-size: 1.2rem; }
    .desc { margin: 0 0 0.4rem; color: var(--fg-muted); }
    .tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0; }
    .tag {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 0.75rem;
        color: var(--fg-muted);
    }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PostCard.astro
git commit -m "Add PostCard component for indexes"
```

---

## Phase 4 — Pages & Routing

### Task 13: Essays index and detail routes

**Files:**
- Create: `src/pages/essays/index.astro`
- Create: `src/pages/essays/[slug].astro`

- [ ] **Step 1: Create `src/pages/essays/index.astro`**

```astro
---
import Base from '../../layouts/Base.astro';
import PostCard from '../../components/PostCard.astro';
import { getEssays } from '../../lib/posts';
const essays = await getEssays();
---
<Base title="Essays — Christian Haddrell" description="Essays on product engineering, agentic tooling, and judgement at the keyboard.">
    <header class="page-header">
        <h1>Essays</h1>
        <p class="muted">Opinion, analysis, reflection.</p>
    </header>
    <section>
        {essays.map((post) => <PostCard post={post} />)}
        {essays.length === 0 && <p class="muted">No essays yet.</p>}
    </section>
</Base>
<style>
    .page-header { margin-bottom: 2rem; }
</style>
```

- [ ] **Step 2: Create `src/pages/essays/[slug].astro`**

```astro
---
import { type CollectionEntry, render } from 'astro:content';
import Post from '../../layouts/Post.astro';
import { getEssays } from '../../lib/posts';

export async function getStaticPaths() {
    const essays = await getEssays();
    return essays.map((post) => ({
        params: { slug: post.id },
        props: post,
    }));
}
type Props = CollectionEntry<'essays'>;
const post = Astro.props;
const { Content } = await render(post);
---
<Post
    title={post.data.title}
    description={post.data.description}
    pubDate={post.data.pubDate}
    updatedDate={post.data.updatedDate}
    tags={post.data.tags}
    kind="essay"
    slug={post.id}
>
    <Content />
</Post>
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds; `/essays/the-adoption-gap/` renders (remove `draft: true` from the seed file first if you want to see it in dev, or run with `npm run dev` which shows drafts).

- [ ] **Step 4: Commit**

```bash
git add src/pages/essays
git commit -m "Add essays index and detail routes"
```

---

### Task 14: Builds index and detail routes

**Files:**
- Create: `src/pages/builds/index.astro`
- Create: `src/pages/builds/[slug].astro`

- [ ] **Step 1: Create `src/pages/builds/index.astro`**

```astro
---
import Base from '../../layouts/Base.astro';
import PostCard from '../../components/PostCard.astro';
import { getBuilds } from '../../lib/posts';
const builds = await getBuilds();
---
<Base title="Builds — Christian Haddrell" description="Personal project write-ups. No client work ever appears here.">
    <header class="page-header">
        <h1>Builds</h1>
        <p class="muted">Personal projects, numbered for continuity.</p>
    </header>
    <section>
        {builds.map((post) => <PostCard post={post} />)}
        {builds.length === 0 && <p class="muted">No builds yet.</p>}
    </section>
</Base>
<style>
    .page-header { margin-bottom: 2rem; }
</style>
```

- [ ] **Step 2: Create `src/pages/builds/[slug].astro`**

```astro
---
import { type CollectionEntry, render } from 'astro:content';
import Post from '../../layouts/Post.astro';
import { getBuilds } from '../../lib/posts';

export async function getStaticPaths() {
    const builds = await getBuilds();
    return builds.map((post) => ({
        params: { slug: post.id },
        props: post,
    }));
}
type Props = CollectionEntry<'builds'>;
const post = Astro.props;
const { Content } = await render(post);
---
<Post
    title={post.data.title}
    description={post.data.description}
    pubDate={post.data.pubDate}
    updatedDate={post.data.updatedDate}
    tags={post.data.tags}
    kind="build"
    number={post.data.number}
    slug={post.id}
>
    <Content />
</Post>
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `/builds/001-haddrell-from-scratch/` renders (after removing `draft: true` or via `npm run dev`).

- [ ] **Step 4: Commit**

```bash
git add src/pages/builds
git commit -m "Add builds index and detail routes"
```

---

### Task 15: Tag index route

**Files:**
- Create: `src/pages/tags/[tag].astro`

- [ ] **Step 1: Create `src/pages/tags/[tag].astro`**

```astro
---
import Base from '../../layouts/Base.astro';
import PostCard from '../../components/PostCard.astro';
import { getAllPosts, getAllTags } from '../../lib/posts';

export async function getStaticPaths() {
    const tags = await getAllTags();
    const posts = await getAllPosts();
    return tags.map((tag) => ({
        params: { tag },
        props: { tag, posts: posts.filter((p) => p.data.tags.includes(tag)) },
    }));
}
const { tag, posts } = Astro.props;
---
<Base title={`#${tag} — Christian Haddrell`} description={`Posts tagged #${tag}.`}>
    <header class="page-header">
        <h1>#{tag}</h1>
        <p class="muted">{posts.length} post{posts.length === 1 ? '' : 's'}.</p>
    </header>
    <section>
        {posts.map((post) => <PostCard post={post} />)}
    </section>
</Base>
<style>
    .page-header { margin-bottom: 2rem; }
</style>
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: generates one page per distinct tag in the seed content.

- [ ] **Step 3: Commit**

```bash
git add src/pages/tags
git commit -m "Add tag index routes"
```

---

### Task 16: Homepage (editorial index)

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import PostCard from '../components/PostCard.astro';
import FormattedDate from '../components/FormattedDate.astro';
import { getEssays, getBuilds, getAllTags, postHref } from '../lib/posts';
import { SITE_DESCRIPTION } from '../consts';

const essays = await getEssays();
const builds = await getBuilds();
const tags = await getAllTags();
const featured = essays[0];
const recent = essays.slice(1, 7);
const latestBuilds = builds.slice(0, 3);
---
<Base title="Christian Haddrell — Product engineering, with receipts" description={SITE_DESCRIPTION}>
    <section class="hero">
        <p class="mono eyebrow">Christian Haddrell</p>
        <h1>{SITE_DESCRIPTION}</h1>
    </section>

    {featured && (
        <section class="featured">
            <p class="mono eyebrow">Featured essay</p>
            <a class="featured-link" href={postHref(featured)}>
                <h2>{featured.data.title}</h2>
                <p class="lede">{featured.data.description}</p>
                <p class="meta mono">
                    <FormattedDate date={featured.data.pubDate} />
                </p>
            </a>
        </section>
    )}

    {tags.length > 0 && (
        <section class="tags">
            <p class="mono eyebrow">Topics</p>
            <ul>
                {tags.map((t) => <li><a href={`/tags/${t}/`}>#{t}</a></li>)}
            </ul>
        </section>
    )}

    <section class="recent">
        <h2>Recent essays</h2>
        {recent.length === 0 && <p class="muted">More essays coming soon.</p>}
        {recent.map((p) => <PostCard post={p} />)}
        <p class="more"><a href="/essays/">All essays &rarr;</a></p>
    </section>

    {latestBuilds.length > 0 && (
        <section class="builds">
            <h2>Builds</h2>
            <ul class="build-list">
                {latestBuilds.map((b) => (
                    <li>
                        <a href={postHref(b)}>
                            <span class="num mono">{String(b.data.number).padStart(3, '0')}</span>
                            <span class="title">{b.data.title}</span>
                        </a>
                    </li>
                ))}
            </ul>
            <p class="more"><a href="/builds/">All builds &rarr;</a></p>
        </section>
    )}
</Base>
<style>
    .eyebrow { color: var(--fg-muted); font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 0.5rem; }
    .hero { padding: 2rem 0 1rem; }
    .hero h1 { font-size: 2rem; max-width: 28ch; margin: 0; }
    .featured { border-top: 1px solid var(--hairline); padding: 2rem 0; }
    .featured-link { display: block; text-decoration: none; color: inherit; }
    .featured-link h2 { font-size: 1.8rem; margin: 0 0 0.4rem; }
    .featured-link:hover h2 { color: var(--accent); }
    .featured .lede { color: var(--fg-muted); max-width: 60ch; margin: 0 0 0.5rem; }
    .featured .meta { color: var(--fg-muted); font-size: 0.8rem; }
    .tags ul { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0; }
    .tags li a {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 0.8rem;
        color: var(--fg-muted);
        text-decoration: none;
        border: 1px solid var(--hairline);
        padding: 0.15em 0.55em;
    }
    .tags li a:hover { color: var(--accent); border-color: var(--accent); }
    .recent, .builds { padding: 2rem 0; border-top: 1px solid var(--hairline); }
    .recent h2, .builds h2 { font-size: 0.9rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--fg-muted); }
    .build-list { list-style: none; padding: 0; margin: 0; }
    .build-list li a {
        display: flex;
        gap: 1rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--hairline);
        text-decoration: none;
        color: inherit;
    }
    .build-list .num { color: var(--accent); min-width: 3ch; }
    .more { margin-top: 1rem; font-family: var(--font-mono), ui-monospace, monospace; font-size: 0.85rem; }
    .more a { color: var(--fg-muted); text-decoration: none; }
    .more a:hover { color: var(--accent); }
</style>
```

- [ ] **Step 2: Build and serve**

Run: `npm run dev`
Open `http://localhost:4321/`.
Expected: editorial homepage with featured essay, topics, recent essays list, builds strip. (Seed content is marked `draft: true`; dev shows drafts, prod hides them.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "Rewrite homepage as editorial index"
```

---

### Task 17: About page

**Files:**
- Modify: `src/pages/about.astro`

- [ ] **Step 1: Replace `src/pages/about.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import { AUTHOR_NAME, PSC_NAME } from '../consts';
---
<Base title="About — Christian Haddrell" description="Senior product engineer. Agentic tooling early adopter. Freelancing through Dougal Debug Limited.">
    <h1>About</h1>
    <p>
        I'm {AUTHOR_NAME} — a senior product engineer based in the UK. I've spent years shipping software end to end,
        and I now work through <strong>{PSC_NAME}</strong>, helping teams ship faster with agentic tooling rather
        than despite it.
    </p>
    <p>
        This site is for essays on engineering judgement, and occasional write-ups of personal builds.
        I don't write about client work — out of respect for confidentiality, anything here is either a
        personal project or an anonymised observation.
    </p>
    <p>
        Find me on <a href="https://www.linkedin.com/in/christian-haddrell/">LinkedIn</a>.
    </p>
</Base>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/about.astro
git commit -m "Rewrite about page"
```

---

### Task 18: Remove legacy blog routes

**Files:**
- Delete: `src/pages/blog/index.astro`
- Delete: `src/pages/blog/[...slug].astro`

- [ ] **Step 1: Delete**

```bash
rm -rf src/pages/blog
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build succeeds with no references to the old `blog` collection or routes.

- [ ] **Step 3: Commit**

```bash
git rm -r src/pages/blog
git commit -m "Remove legacy blog routes"
```

---

## Phase 5 — Feeds and Agent-Readability

### Task 19: RSS feed for both collections, full content

**Files:**
- Modify: `src/pages/rss.xml.js`

- [ ] **Step 1: Replace `src/pages/rss.xml.js`**

```js
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts.ts';
import { getAllPosts, isBuild } from '../lib/posts.ts';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';

const parser = new MarkdownIt({ html: true });

export async function GET(context) {
    const posts = await getAllPosts();
    return rss({
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        site: context.site,
        items: await Promise.all(posts.map(async (post) => {
            const link = isBuild(post) ? `/builds/${post.id}/` : `/essays/${post.id}/`;
            const body = post.body ? sanitizeHtml(parser.render(post.body), {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
                allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'title'] },
            }) : '';
            return {
                title: post.data.title,
                description: post.data.description,
                pubDate: post.data.pubDate,
                link,
                content: body,
                categories: post.data.tags,
            };
        })),
    });
}
```

- [ ] **Step 2: Install RSS helpers**

```bash
npm install sanitize-html markdown-it
npm install -D @types/sanitize-html @types/markdown-it
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `/rss.xml` built; contains full HTML bodies as `<content:encoded>` CDATA blocks.

- [ ] **Step 4: Commit**

```bash
git add src/pages/rss.xml.js package.json package-lock.json
git commit -m "RSS feed for essays and builds with full content"
```

---

### Task 20: Markdown companion routes

**Files:**
- Create: `src/pages/essays/[slug].md.ts`
- Create: `src/pages/builds/[slug].md.ts`

- [ ] **Step 1: Create `src/pages/essays/[slug].md.ts`**

```ts
import type { APIRoute, GetStaticPaths } from 'astro';
import { getEssays } from '../../lib/posts';

export const getStaticPaths: GetStaticPaths = async () => {
    const essays = await getEssays();
    return essays.map((post) => ({ params: { slug: post.id }, props: post }));
};

export const GET: APIRoute = async ({ props }) => {
    const post = props as Awaited<ReturnType<typeof getEssays>>[number];
    const fm = `---\ntitle: ${JSON.stringify(post.data.title)}\npubDate: ${post.data.pubDate.toISOString()}\ntags: ${JSON.stringify(post.data.tags)}\nurl: /essays/${post.id}/\n---\n\n`;
    return new Response(fm + (post.body ?? ''), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
};
```

- [ ] **Step 2: Create `src/pages/builds/[slug].md.ts`**

```ts
import type { APIRoute, GetStaticPaths } from 'astro';
import { getBuilds } from '../../lib/posts';

export const getStaticPaths: GetStaticPaths = async () => {
    const builds = await getBuilds();
    return builds.map((post) => ({ params: { slug: post.id }, props: post }));
};

export const GET: APIRoute = async ({ props }) => {
    const post = props as Awaited<ReturnType<typeof getBuilds>>[number];
    const fm = `---\ntitle: ${JSON.stringify(post.data.title)}\npubDate: ${post.data.pubDate.toISOString()}\nnumber: ${post.data.number}\ntags: ${JSON.stringify(post.data.tags)}\nurl: /builds/${post.id}/\n---\n\n`;
    return new Response(fm + (post.body ?? ''), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
};
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Inspect: `dist/essays/the-adoption-gap.md` should exist with frontmatter + body.

- [ ] **Step 4: Commit**

```bash
git add src/pages/essays/[slug].md.ts src/pages/builds/[slug].md.ts
git commit -m "Serve Markdown companions for posts"
```

---

### Task 21: llms.txt and llms-full.txt

**Files:**
- Create: `src/pages/llms.txt.ts`
- Create: `src/pages/llms-full.txt.ts`

- [ ] **Step 1: Create `src/pages/llms.txt.ts`**

```ts
import type { APIRoute } from 'astro';
import { getAllPosts, isBuild } from '../lib/posts';
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export const GET: APIRoute = async () => {
    const posts = await getAllPosts();
    const lines: string[] = [];
    lines.push(`# ${SITE_TITLE}`);
    lines.push('');
    lines.push(`> ${SITE_DESCRIPTION}`);
    lines.push('');
    lines.push('This site publishes essays on product engineering and write-ups of personal builds.');
    lines.push('No client work appears here.');
    lines.push('');
    lines.push('## Posts');
    for (const p of posts) {
        const slug = p.id;
        const path = isBuild(p) ? `/builds/${slug}/` : `/essays/${slug}/`;
        const md = `${path.replace(/\/$/, '')}.md`;
        lines.push(`- [${p.data.title}](${SITE_URL}${path}) — ${p.data.description} ([markdown](${SITE_URL}${md}))`);
    }
    lines.push('');
    lines.push('## Full content');
    lines.push(`- [llms-full.txt](${SITE_URL}/llms-full.txt) — every post concatenated as Markdown`);
    lines.push('');
    return new Response(lines.join('\n'), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
};
```

- [ ] **Step 2: Create `src/pages/llms-full.txt.ts`**

```ts
import type { APIRoute } from 'astro';
import { getAllPosts, isBuild } from '../lib/posts';
import { SITE_URL, SITE_TITLE } from '../consts';

export const GET: APIRoute = async () => {
    const posts = await getAllPosts();
    const parts: string[] = [];
    parts.push(`# ${SITE_TITLE} — full archive`);
    parts.push('');
    for (const p of posts) {
        const path = isBuild(p) ? `/builds/${p.id}/` : `/essays/${p.id}/`;
        parts.push(`---`);
        parts.push(`title: ${JSON.stringify(p.data.title)}`);
        parts.push(`url: ${SITE_URL}${path}`);
        parts.push(`pubDate: ${p.data.pubDate.toISOString()}`);
        parts.push(`tags: ${JSON.stringify(p.data.tags)}`);
        parts.push(`---`);
        parts.push('');
        parts.push(p.body ?? '');
        parts.push('');
    }
    return new Response(parts.join('\n'), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
};
```

- [ ] **Step 3: Build**

Run: `npm run build`
Inspect: `dist/llms.txt` and `dist/llms-full.txt` exist and contain expected content.

- [ ] **Step 4: Commit**

```bash
git add src/pages/llms.txt.ts src/pages/llms-full.txt.ts
git commit -m "Serve llms.txt and llms-full.txt"
```

---

## Phase 6 — Search (Pagefind)

### Task 22: Install and integrate Pagefind

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`
- Modify: `src/components/Header.astro`
- Create: `src/components/Search.astro`

- [ ] **Step 1: Install Pagefind and integration**

```bash
npm install -D pagefind astro-pagefind
```

- [ ] **Step 2: Add the integration to `astro.config.mjs`**

```js
// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
    site: 'https://www.haddrell.co.uk',
    integrations: [mdx(), sitemap(), pagefind()],
    fonts: [ /* unchanged — see Task 2 */ ],
});
```

Keep the existing fonts block intact.

- [ ] **Step 3: Create `src/components/Search.astro`**

```astro
---
---
<link rel="preconnect" href="/pagefind/" />
<div id="search" data-pagefind-ui></div>
<script>
    import { PagefindUI } from '@pagefind/default-ui';
    import '@pagefind/default-ui/css/ui.css';
    new PagefindUI({
        element: '#search',
        showImages: false,
        showSubResults: true,
        resetStyles: false,
    });
</script>
<style is:global>
    :root {
        --pagefind-ui-primary: var(--fg);
        --pagefind-ui-text: var(--fg);
        --pagefind-ui-background: var(--bg);
        --pagefind-ui-border: var(--hairline);
        --pagefind-ui-tag: var(--code-bg);
        --pagefind-ui-border-width: 1px;
        --pagefind-ui-border-radius: 2px;
        --pagefind-ui-font: var(--font-sans), system-ui, sans-serif;
    }
    #search { max-width: var(--container); margin: 0 auto; }
</style>
```

- [ ] **Step 4: Install the Pagefind default UI dependency**

```bash
npm install @pagefind/default-ui
```

- [ ] **Step 5: Add data attributes for indexing in `src/layouts/Post.astro`**

In `Post.astro`, change the outer `<article>` to `<article data-pagefind-body>` so Pagefind indexes post content but not chrome. Change:

```astro
<article>
```

to:

```astro
<article data-pagefind-body>
```

- [ ] **Step 6: Add a search page**

Create `src/pages/search.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Search from '../components/Search.astro';
---
<Base title="Search — Christian Haddrell" description="Search essays and builds.">
    <h1>Search</h1>
    <Search />
</Base>
```

- [ ] **Step 7: Add a search link in the Header**

Edit `src/components/Header.astro`, add `<a href="/search/">Search</a>` inside `<nav aria-label="Primary">` before `<a href="/essays/">Essays</a>`.

- [ ] **Step 8: Build and test**

Run: `npm run build`
Run: `npm run preview`
Open `http://localhost:4321/search/`.
Expected: Pagefind UI loads; typing a word from the seed posts returns results (remove `draft: true` on seed posts if you need content indexed in a production build, since `draft: true` filters them out via `getAllPosts`).

- [ ] **Step 9: Commit**

```bash
git add src/components/Search.astro src/pages/search.astro src/components/Header.astro src/layouts/Post.astro astro.config.mjs package.json package-lock.json
git commit -m "Add Pagefind search and /search page"
```

---

## Phase 7 — Deploy and Verify

### Task 23: Public assets and favicon alignment

**Files:**
- Modify: `public/favicon.svg` (optional)
- Create: `public/robots.txt`

- [ ] **Step 1: Create `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://www.haddrell.co.uk/sitemap-index.xml
```

- [ ] **Step 2: Review `public/favicon.svg`**

If the current favicon is the Astro default, replace it with a simplified Dougal silhouette or a monogram 'H'. If unsure, leave as-is for v1.

- [ ] **Step 3: Commit**

```bash
git add public/robots.txt
git commit -m "Add robots.txt pointing at sitemap"
```

---

### Task 24: Full-site build verification

**Files:** none

- [ ] **Step 1: Turn off draft flag on seed content for the verification pass**

Edit both seed files to `draft: false`, then run build.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: no errors. `dist/` contains: `index.html`, `essays/the-adoption-gap/index.html`, `essays/the-adoption-gap.md`, `builds/001-haddrell-from-scratch/index.html`, `builds/001-haddrell-from-scratch.md`, `tags/<each>/index.html`, `rss.xml`, `sitemap-index.xml`, `llms.txt`, `llms-full.txt`, `pagefind/` directory, `search/index.html`.

- [ ] **Step 3: Preview and spot-check**

Run: `npm run preview`

Walk through manually:
- Homepage loads, featured essay rendered, topics strip present, builds strip present
- Theme toggle cycles `A` → `L` → `D` → `A`; dark palette kicks in under `D`, `A` follows system preference
- `/essays/` lists the essay; click-through renders body with JSON-LD script in head (View Source: search for `BlogPosting`)
- `/builds/001-haddrell-from-scratch/` renders with `BUILD 001` badge
- `/tags/agentic-tools/` lists exactly the essay
- `/search/` returns hits for a word known to be in the essay
- `/rss.xml` validates: paste into https://validator.w3.org/feed/
- `/llms.txt` and `/llms-full.txt` fetch as text
- Right-click the markdown link in the post footer — the `.md` file downloads as plain text

- [ ] **Step 4: Revert drafts**

Re-set seed files to `draft: true` (so prod shows no posts until real ones land) OR leave published if the content is genuinely the launch piece.

- [ ] **Step 5: Commit whatever state is intended for launch**

```bash
git add src/content/essays src/content/builds
git commit -m "Set seed content draft state for launch"
```

---

### Task 25: Cloudflare Pages deployment (follow existing PLAN.md)

**Files:** none — deployment is governed by `PLAN.md` in repo root.

- [x] **Step 1: Read `PLAN.md`**

Confirm the 7-step deployment runbook is still accurate: push to GitHub, create Cloudflare Pages project, set build command `npm run build`, output directory `dist`, bind `www.haddrell.co.uk` domain, configure DNS CNAME via GoDaddy Domain Connect, verify.

- [x] **Step 2: Push branch**

```bash
git push -u origin main
```

- [x] **Step 3: Execute deployment runbook**

Work through `PLAN.md` steps 1–7. No code changes; this is infra config via Cloudflare dashboard and GoDaddy.

- [x] **Step 4: Post-deploy smoke test**

Visit `https://www.haddrell.co.uk/` and spot-check the same list from Task 24 Step 3. Verify:
- HTTPS served
- Theme toggle works
- RSS validates against live URL

- [x] **Step 5: Commit any last-mile adjustments if needed**

```bash
git commit -am "Post-deploy fixes"
git push
```

---

## Self-Review (writing-plans skill checklist)

**Spec coverage:**

| Spec section | Covered in |
|---|---|
| §1 Overview | Task 1 (metadata), whole plan |
| §2 Audience & Positioning | Task 1, 17 (about), 16 (tagline on hero) |
| §3 Content Model (essays, builds, tags, cadence, comments, newsletter) | Tasks 5, 6, 13, 14, 15 — no comments, no newsletter (non-goal, not implemented) |
| §4 Identity & Branding (wordmark, Dougal, PSC) | Tasks 1, 9 (wordmark in Header), 10 (Dougal + PSC in Footer) |
| §5 Visual Design (typography, palette, dates, anti-AI cues) | Tasks 2 (fonts), 3 (palette), 7 (UK date), 9/10 (hairlines and flat) |
| §6 Information Architecture (routes, homepage, about) | Tasks 13–18 |
| §7 Dark Mode (auto/light/dark, toggle, localStorage, no FOUC) | Tasks 3, 4, 8 |
| §8 Search (Pagefind) | Task 22 |
| §9 Agent-Readability (llms.txt, full, .md companions, JSON-LD, semantic HTML) | Tasks 11 (JSON-LD + semantic HTML), 20, 21 |
| §10 Feeds & Syndication (RSS full, sitemap) | Task 19 (RSS). Sitemap already wired in `astro.config.mjs` from Task 1. |
| §11 Scope Defaults / Non-Goals | Nothing to build — correctly omitted |
| §12 References | Plan references spec, PLAN.md |

**Placeholder scan:** Scanned for "TBD", "TODO", "similar to", "appropriate". Found zero in actionable steps. Task 10 step 3 does flag that the Companies House number is a confirm-before-commit item — this is a legitimate human-verification gate rather than an engineering placeholder.

**Type consistency:**
- `Post`, `Essay`, `Build` types defined in Task 5 step 2; used by Tasks 12, 13, 14, 15, 19, 20, 21.
- `postHref`, `isBuild` helpers defined in Task 5 step 2; used by Tasks 12, 16, 19, 20, 21.
- `SITE_TITLE`, `SITE_DESCRIPTION`, `SITE_URL`, `AUTHOR_NAME`, `PSC_NAME` defined in Task 1 step 1; used by Tasks 8, 10, 11, 16, 17, 19, 20, 21.
- Post layout `Props` interface (`title`, `description`, `pubDate`, `updatedDate`, `tags`, `kind`, `number`, `slug`) consistent between Task 11 definition and Tasks 13/14 consumers.
- Theme data attribute: `data-theme-pref` (user setting) and `data-theme` (applied override) — used consistently by Tasks 3, 4, 8.
- Font CSS variables: `--font-sans` and `--font-mono` — consistent across Tasks 2, 3, 8.

Plan is coherent and self-consistent.
