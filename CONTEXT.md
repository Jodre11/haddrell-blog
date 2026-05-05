# Context for PLAN.md

Reasoning and constraints behind `PLAN.md`. Read if a step seems arbitrary
or you're tempted to change the approach.

## Hard constraints — do not break

- **Family email is business-critical.** ~5 mailboxes on M365 Family
  custom domain. Email records (`MX`, `SPF`, `autodiscover`) must stay
  untouched. Apex A records (LinkedIn redirect) also stay untouched.
- **DNS authority is GoDaddy, not 123-reg.** NS records delegate to
  `ns75/76.domaincontrol.com`. 123-reg's DNS panel shows records but
  edits there are not served. All DNS changes go via
  `account.microsoft.com` (primary) or a GoDaddy shadow account
  surfaced by password reset (fallback).

## Key decisions and why

| Decision                                           | Why                                                                                               |
|----------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Blog on `www`, apex keeps redirecting to LinkedIn  | One DNS change instead of twelve; no risk to email; preserves existing redirect                   |
| Cloudflare Pages (free) + Astro                    | £0/yr, zero-config TLS, Git-driven, Astro handles RSS/sitemap/OG                                  |
| Don't move nameservers to Cloudflare               | Breaks Microsoft's Domain Connect auto-management of email records                                |
| Stay on 123-reg as registrar                       | Saving from moving is ~£4–5/yr; GoDaddy DNS is already free via Domain Connect                    |
| Stay on M365 Family for email                      | Best value (£99/yr includes Office + 1TB/user for 6 users); email-only alternatives cost more     |
| DMARC ceiling is `p=quarantine`, never `p=reject`  | DKIM unavailable for this SKU → SPF-only alignment → reject kills legitimate forwarded mail       |

## SKU specifics (M365 Family personalized email)

- Consumer product, not business Exchange Online.
- Grandfathered — new sign-ups closed ~2024. If broken, not re-creatable.
- MX pattern `*.pamx1.hotmail.com` identifies it.
- Not administered at `admin.microsoft.com` or `security.microsoft.com`
  (those are business). Use `account.microsoft.com` → M365 Family →
  Premium features → Personalized email addresses.
- **DKIM is not customer-configurable on this SKU** (confirmed 2026-04-15
  via Microsoft Q&A threads). Do not publish
  `selector1._domainkey` / `selector2._domainkey` CNAMEs — they would
  point at nothing. Re-check April 2027.

## Forcing event for consolidation

Microsoft will likely deprecate the Family custom-domain feature. When
that happens, migrate email to Fastmail/Migadu/Proton, DNS to Cloudflare,
registrar to Porkbun or Cloudflare Registrar — one painful migration
instead of two. Until then, current split is fine.

## Current DNS baseline (verified 2026-04-15)

Specific record values intentionally not committed to this public repo. The
shape of the zone (relevant to the plan):

- Apex `A` records point at the LinkedIn redirect target.
- `www` `A` record points at the registrar parking host (replaced in step 5).
- `MX` is a `*.pamx1.hotmail.com` host (identifies M365 Family — see SKU
  specifics above).
- `TXT @` carries `v=spf1 include:outlook.com -all`.
- `autodiscover` and `_domainconnect` CNAMEs point at standard Microsoft /
  GoDaddy targets.
- A legacy Google Search Console verification CNAME exists; status to be
  reviewed separately.
- `_dmarc` TXT empty until step 6.
- `selector{1,2}._domainkey` CNAMEs empty (DKIM unavailable on this SKU).

## Stale items to investigate (low priority, not in PLAN.md)

- The legacy Google Search Console verification CNAME — confirm Search
  Console doesn't need it, then remove.
- Whether apex LinkedIn redirect should move to a subdomain like
  `/linkedin` later (UX question, not technical).

## Pointers to auto-memory

Loaded into future Claude sessions automatically:

- `project_haddrell_dmarc_rollout.md` — DMARC policy ladder.
- `project_haddrell_dkim_unavailable.md` — DKIM unavailable, re-check
  April 2027.
- `project_haddrell_consolidation.md` — consolidation deferred,
  forcing event to watch for.

Location: `~/.claude/projects/-Users-jodre11-dotfiles/memory/`.
