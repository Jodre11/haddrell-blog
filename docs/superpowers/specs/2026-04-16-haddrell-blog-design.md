# Haddrell Blog — Design Spec

**Date:** 2026-04-16
**Owner:** Christian Haddrell
**Domain:** www.haddrell.co.uk
**Stack:** Astro + Cloudflare Pages

## 1. Overview

A personal blog serving as a portfolio/credibility signal for Christian Haddrell — a
seasoned product engineer adopting agentic tools, in contrast to colleagues stuck in
traditional methods. The site must read as authored, not AI-generated, while being
highly parseable by both human readers and agentic tools (search engines, LLM crawlers,
RSS readers).

Confidentiality constraint: Christian operates as a freelancer through Dougal Debug
Limited. No client PII, commercial specifics, or identifying engagement details ever
appear on the site. Builds written up here are personal projects only.

## 2. Audience & Positioning

**Primary audience:** prospective employers and clients evaluating whether Christian is
the right senior engineer for their team — specifically those who understand that
agentic tooling is now table stakes for high-leverage engineers.

**Secondary audience:** peers and fellow practitioners who find the writing via search,
syndication, or word of mouth.

**Positioning:** product engineer, not "a C# developer". The differentiator is
cross-cutting judgement across code, product, ops, and process — with receipts. Tonal
reference points: Eric Lippert's clarity of exposition; Scott Hanselman's breadth and
warmth.

**Tagline:** "Product engineering, with receipts."

## 3. Content Model

Two content types, tag-based rather than category-based:

- **Essays** — `/essays/<slug>` — opinion, analysis, reflection. The main vehicle for
  establishing voice and point of view.
- **Builds** — `/builds/<NNN>-<slug>` — write-ups of personal projects. Numbered for
  continuity (e.g. `003-haddrell-from-scratch`). Builds are *only* personal projects;
  never client work.

Tags cut across both types (e.g. `agentic-tools`, `astro`, `dotnet`, `process`).

**Cadence:** no public cadence claim. Posts ship when ready.

**Comments:** off. External discussion happens wherever readers prefer (Mastodon,
LinkedIn, email).

**Newsletter:** deferred. Not launching with one.

## 4. Identity & Branding

**Wordmark**

- Full: "Christian Haddrell"
- Compact (small spaces, favicon-adjacent): "Haddrell"

**Colophon / PSC footer**

- "Dougal Debug Limited" appears in the footer alongside the Dougal mark.

**Dougal mark**

- Outlined dog illustration, three-colour (black silhouette, white interior highlights,
  red glasses), transparent everywhere else. Single SVG works on any background in both
  light and dark mode. Source: `public/dougal.svg`.
- Used only as a footer colophon — not in the primary header. Keeps the site reading
  editorial-first rather than mascot-first.

## 5. Visual Design

**Direction:** editorial with an accent red. Swiss grid; asymmetric; flat; hairlines
rather than shadows.

**Typography**

- Body and headings: **IBM Plex Sans**
- Code and metadata: **IBM Plex Mono**

**Palette**

| Role           | Light           | Dark                                 |
|----------------|-----------------|--------------------------------------|
| Background     | `#fff`          | `#111`                               |
| Foreground     | `#111`          | `#e8e8e8`                            |
| Accent         | `#fe0000`       | `#fe0000` (test softer `#ff4a4a` on OLED if dazzle is an issue) |
| Hairlines      | `#111` @ 10%    | `#e8e8e8` @ 12%                      |

**Date format:** `15 Apr 2026` — day, short month, year. No ordinals, no commas.

**Anti-AI cues** (authorial feel, away from generic LLM-generated aesthetics):

- Asymmetric layout; no centred-everything
- Flat — no drop shadows, no glass, no gradients
- Hairline rules instead of cards
- Named typefaces (Plex), not system stacks
- Specific accent red rather than a generic indigo/teal
- Human date format

## 6. Information Architecture

**Routes**

- `/` — editorial homepage
- `/essays/` — essay index
- `/essays/<slug>` — essay detail
- `/builds/` — build index
- `/builds/<NNN>-<slug>` — build detail
- `/tags/<tag>` — tag index
- `/about` — short about page
- `/rss.xml` — feed
- `/sitemap-index.xml` — sitemap
- `/llms.txt`, `/llms-full.txt` — LLM-readable index
- `/posts/<slug>.md` — Markdown companion for each post

**Homepage structure (editorial index)**

1. Masthead: wordmark "Christian Haddrell", tagline "Product engineering, with
   receipts.", dark-mode toggle
2. Featured essay (hero slot, single item)
3. Topic filter strip (top tags)
4. Recent essays (list, 5–7 items)
5. Builds strip (horizontal list of 3 most recent builds with numbers)
6. Footer: Dougal colophon, "Dougal Debug Limited", links (RSS, sitemap, llms.txt)

**About page:** short. Who, where, what he does, confidentiality note, contact.

## 7. Dark Mode

**Detection and control**

- Default behaviour: honour `prefers-color-scheme`
- Header toggle offers three states: `auto` / `light` / `dark`
- User choice persisted in `localStorage`; `auto` clears the override

**Rendering**

- Colour tokens driven by CSS custom properties under `[data-theme="..."]`
- Dougal SVG renders correctly on any background without modification (three explicit
  fills plus transparency — no `currentColor` tricks)

## 8. Search

**Pagefind** (static, client-side, no server required).

- Indexes essays and builds at build time
- Search UI lives on the homepage masthead and on index pages
- Keyboard-first: `/` focuses search; `Esc` closes

## 9. Agent-Readability

This is a first-class concern, not a plugin afterthought. The site is designed to be
parsed cleanly by LLM-driven crawlers and agentic readers.

**`llms.txt`** — root-level index summarising the site, linking to key sections.
**`llms-full.txt`** — concatenation of all posts in Markdown for one-shot ingestion.

**Markdown companions** — every post is reachable at `/posts/<slug>.md` as raw
Markdown, so agents can fetch clean content without HTML scraping.

**Structured data** — each post page includes `schema.org/BlogPosting` JSON-LD
(headline, datePublished, dateModified, author, keywords, articleBody reference).

**Semantic HTML** — `<article>`, `<time datetime>`, `<nav>`, proper heading hierarchy.

## 10. Feeds & Syndication

- **RSS/Atom** via `@astrojs/rss` at `/rss.xml` — full content, not excerpts
- **Sitemap** via `@astrojs/sitemap` at `/sitemap-index.xml`
- Both linked from `<head>` and from the footer

## 11. Scope Defaults & Non-Goals

**In scope**

- Astro static build, TypeScript strict
- Cloudflare Pages deployment (already planned in `PLAN.md`)
- Dark mode with toggle
- Pagefind search
- llms.txt, llms-full.txt, .md companions
- RSS, sitemap, JSON-LD
- Dougal SVG colophon

**Out of scope (explicitly deferred)**

- Comments
- Newsletter / email capture
- Analytics beyond whatever Cloudflare Pages provides for free
- Any form of client or engagement-specific content
- Custom CMS — posts are Markdown files in the repo
- Stated posting cadence

## 12. References

- `PLAN.md` — deployment runbook (Astro → GitHub → Cloudflare Pages → DNS via M365
  Domain Connect)
- `CONTEXT.md` — constraints: family email on M365 Family SKU, DNS authority is GoDaddy
  via Domain Connect (not 123-reg), DKIM unavailable
- `public/dougal.svg` — approved logo artefact (three-colour, transparent background)
