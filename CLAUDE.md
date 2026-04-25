# CLAUDE.md

Repo-specific notes for Claude. Keep entries terse and current; remove them when they no longer apply.

## Deferred upgrades

**TypeScript major (5.x → 6.x):** blocked on `@astrojs/check`. Major bumps for `typescript` are ignored in `.github/dependabot.yml`. When dependency work comes up, check whether the upstream peer has widened:

```bash
npm view @astrojs/check@latest peerDependencies.typescript
```

If the result accepts `^6` (currently `^5.0.0`), remove the `ignore:` block for `typescript` in `.github/dependabot.yml` and let Dependabot reopen the major bump on its next run.
