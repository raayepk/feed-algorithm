/**
 * Raaye For You Feed — Scoring Formula
 *
 * This file is the single source of truth for every weight used in the
 * For You feed ranking formula. The SQL query in feed.queries.ts injects
 * these values directly so the implementation always matches this document.
 *
 * Formula:
 *
 *   score = (likes × W.like  +  reposts × W.repost  +  quotes × W.quote  +  replies × W.reply)
 *           ─────────────────────────────────────────────────────────────────────────────────────
 *                         (age_in_hours + G.offset) ^ G.exponent
 *
 * Design decisions:
 *
 *   - Likes are highest: a deliberate, positive endorsement.
 *   - Reposts and quotes share the same weight: a quote adds commentary but
 *     can equally be used to dunk or mock; we do not reward dunking-amplification
 *     by giving quotes a premium over reposts.
 *   - Replies are lowest: high reply counts often signal controversy, not quality.
 *     Outrage generates replies; we deliberately underweight this signal.
 *   - View count is intentionally excluded: views are passive and easily inflated.
 *   - Political affiliation is never used: see docs/adr/0002 and /about/algorithm.
 *
 * Changing any value here automatically updates the live query. Add a changelog
 * entry in apps/web/src/app/about/algorithm/page.tsx for every change.
 */

export const FEED_WEIGHTS = {
  like:   3,
  repost: 2,
  quote:  2,
  reply:  1,
} as const

export const GRAVITY = {
  /** Added to age (hours) before exponentiation. Prevents age=0 → infinite score. */
  offset:   2,
  /** HN-style gravity exponent. Higher = faster decay for older posts. */
  exponent: 1.5,
} as const

/** Convenience: the SQL ORDER BY expression, built from the constants above. */
export const FOR_YOU_SCORE_SQL = `
  (
    p.like_count * ${FEED_WEIGHTS.like}
    + p.repost_count * ${FEED_WEIGHTS.repost}
    + p.quote_count  * ${FEED_WEIGHTS.quote}
    + p.reply_count  * ${FEED_WEIGHTS.reply}
  )::float
  / POWER(
      EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0 + ${GRAVITY.offset},
      ${GRAVITY.exponent}
    )
`.trim()
