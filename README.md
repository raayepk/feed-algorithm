# Raaye Feed Algorithm

This repository is the public, auditable source for the algorithm that ranks content in [Raaye](https://raaye.pk)'s **For You** feed.

Every time a weight or formula constant changes in the main Raaye codebase, this file is automatically synced here via a GitHub Actions workflow. The commit message mirrors the original commit so the history is traceable.

---

## The formula

```
score = (likes × 3  +  reposts × 2  +  quotes × 2  +  replies × 1)
        ─────────────────────────────────────────────────────────────
                         (age_in_hours + 2) ^ 1.5
```

See [`feed-scoring.ts`](./feed-scoring.ts) for the exact constants and the SQL expression that is injected into every For You query.

---

## Weight rationale

| Signal | Weight | Why |
|--------|--------|-----|
| Like | ×3 | A deliberate, positive endorsement — the strongest signal. |
| Repost | ×2 | Actively sharing to your followers indicates genuine value. |
| Quote | ×2 | Equal to repost. Quotes add commentary but can equally be used to mock; giving them a premium over reposts would reward outrage amplification. |
| Reply | ×1 | Intentionally lowest. High reply counts often signal controversy, not quality. |

### Time decay

The denominator `(age_in_hours + 2)^1.5` is a [Hacker News–style gravity curve](https://news.ycombinator.com/item?id=1781013). The `+2` offset prevents brand-new posts from getting an infinite score; the `1.5` exponent makes older content decay faster than a linear formula would.

Posts older than 7 days are excluded from For You regardless of engagement.

---

## What is never used

The following signals are **explicitly excluded** from all ranking:

- Political party affiliation — what party you support or belong to has zero influence on For You ranking (see [ADR 0002](https://raaye.pk/about/algorithm#political))
- Your following graph — For You is not personalised to whom you follow
- Profile verification tier
- View count — recorded but not ranked on (easily inflated)
- Author follower count or account age
- Location or device

---

## Signals list

Full list of used and excluded signals, with reasoning, is maintained on the public-facing page:  
**[raaye.pk/about/algorithm](https://raaye.pk/about/algorithm)**

---

## How this file is updated

A GitHub Actions workflow in the private Raaye monorepo watches `packages/utils/src/feed-scoring.ts`. On every push to `main` that touches that file, it copies the new version here and commits with the same message as the original commit. No human intervention is required for updates.

The algorithm is implemented as a TypeScript file and injected directly into the PostgreSQL query — there is no separate "production copy". What you see here is what runs.

---

## Changelog

See the [algorithm page on Raaye](https://raaye.pk/about/algorithm#changelog) for the full version history with dates and reasoning for every change.

| Version | Date | Summary |
|---------|------|---------|
| v1.1 | 2026-06-27 | Added quote weight (×2, equal to reposts). Single source-of-truth file introduced. |
| v1.0 | 2025 | Initial release: likes ×3, reposts ×2, replies ×1, HN-style gravity decay. |

---

*Raaye (رائے) — Pakistani political social community. [raaye.pk](https://raaye.pk)*
