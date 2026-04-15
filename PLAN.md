# Blog deployment plan

Pick up from here. Scaffolded with `npm create astro@latest` using the `blog`
template (TypeScript strict, git initialised). Deploy target: Cloudflare Pages
on `www.haddrell.co.uk`. Apex `haddrell.co.uk` stays redirecting to LinkedIn.
Email is untouched.

## Step 1 — Site metadata

Edit `src/consts.ts`:

- `SITE_TITLE`
- `SITE_DESCRIPTION`

Update `src/pages/about.astro`. Delete or replace the sample posts under
`src/content/blog/`.

## Step 2 — Push to GitHub

```
cd ~/Repos/haddrell-blog
gh repo create Jodre11/haddrell-blog --public --source=. --remote=origin --push
```

(Repo will already exist once this plan is committed — skip `gh repo create`
and just `git push -u origin main`.)

## Step 3 — Cloudflare Pages, first deploy

1. dash.cloudflare.com → Workers & Pages → **Create application** → **Pages**
   tab → **Connect to Git**.
2. Authorise Cloudflare's GitHub app, select `Jodre11/haddrell-blog`.
3. Framework preset: **Astro**. Build command `npm run build`, output `dist`.
4. **Save and Deploy.** Visit `haddrell-blog.pages.dev` to confirm it renders.

## Step 4 — Add custom domain in Pages

1. Pages project → **Custom domains** → **Set up a custom domain** →
   `www.haddrell.co.uk`.
2. Cloudflare shows the CNAME target (typically `haddrell-blog.pages.dev`).
   Note it. Do **not** click Activate yet.

## Step 5 — Publish the `www` CNAME via GoDaddy/Microsoft

**Not via 123-reg — its DNS panel is a decoy.** Authoritative DNS is GoDaddy
(`ns75/76.domaincontrol.com`) via Microsoft Domain Connect.

Primary path:

1. account.microsoft.com → Services & subscriptions → Microsoft 365 Family →
   Manage → Premium features / Personalized email addresses → Manage domain →
   DNS records.
2. Delete the existing `www A ***REMOVED-IP***` record.
3. Add:
   ```
   Type:   CNAME
   Host:   www
   Target: haddrell-blog.pages.dev
   TTL:    default
   ```

Fallback path if the Microsoft UI refuses arbitrary CNAMEs: try
`sso.godaddy.com/` password reset against `***REMOVED-EMAIL***` — a
shadow GoDaddy account likely exists from Domain Connect provisioning. Edit
via its DNS Management panel.

## Step 6 — Opportunistic while in the DNS panel: add DMARC

Same panel, add:

```
Type:  TXT
Host:  _dmarc
Value: v=DMARC1; p=none; rua=mailto:***REMOVED-EMAIL***; fo=1
TTL:   default
```

`p=none` is monitor-only — zero risk to family email. Leave at `p=none`
indefinitely (see memory: `project_haddrell_dmarc_rollout.md`). Cap at
`p=quarantine` long term; never `p=reject` (DKIM is unavailable for the
M365 Family SKU).

## Step 7 — Verify and activate

```
dig +short CNAME www.haddrell.co.uk
dig @ns75.domaincontrol.com +short CNAME www.haddrell.co.uk
dig +short TXT _dmarc.haddrell.co.uk
```

Expect the first two to return `haddrell-blog.pages.dev.` and the third to
return the DMARC record. Propagation on `domaincontrol.com` is typically
under an hour.

Back in Cloudflare Pages → Custom domains: it verifies the CNAME, issues a
TLS cert (~1 minute). Visit `https://www.haddrell.co.uk` — should serve the
blog.

## Deferred (not part of this deployment)

- Per-post OG images via `astro-og-canvas`.
- Agentic-development `/builds` section with raw session transcripts and
  diffs — the differentiator content.
- Eventual migration off M365 Family / 123-reg / GoDaddy onto a single vendor
  — wait for Microsoft to deprecate the consumer custom-domain SKU as the
  forcing event (see memory: `project_haddrell_consolidation.md`).
