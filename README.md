# haddrell-blog

Source for [www.haddrell.co.uk](https://www.haddrell.co.uk) — Christian Haddrell's
personal site. Publishes essays on product engineering and write-ups of personal
builds. No client work appears here.

## Tech stack

- [Astro 6](https://astro.build) (static output)
- MDX for long-form content (`src/content/essays/`, `src/content/builds/`)
- [Pagefind](https://pagefind.app/) for client-side search
- Hosted on Cloudflare Workers Static Assets

## Local development

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview the build locally |
| `npm run astro -- --help` | Astro CLI help |

Node.js 22.12+ is required (see `package.json`).

## Further reading

- Design spec: `docs/superpowers/specs/2026-04-16-haddrell-blog-design.md`
- Deployment context and active work log: `CONTEXT.md`, `PLAN.md`
