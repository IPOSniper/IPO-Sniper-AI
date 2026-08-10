/**
 * Standard investment recommendations used throughout IPO Sniper AI.
 *
 * NOTE:
 * Only the Decision Engine is allowed to assign one of these.
 * Analyzers provide evidence—they never recommend.
 */
export enum Recommendation {
  STRONG_BUY = "Strong Buy",
  BUY = "Buy",
  WATCH = "Watch",
  HOLD = "Hold",
  AVOID = "Avoid",
}