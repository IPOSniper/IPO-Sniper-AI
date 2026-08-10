export const AI_RECOMMENDATIONS = [
  "Strong Buy",
  "Buy",
  "Watch",
  "Hold",
  "Avoid",
] as const;

export type AIRecommendation =
  typeof AI_RECOMMENDATIONS[number];

export const RecommendationColors: Record<
  AIRecommendation,
  string
> = {
  "Strong Buy": "text-emerald-400",
  Buy: "text-green-400",
  Watch: "text-cyan-400",
  Hold: "text-yellow-400",
  Avoid: "text-red-400",
};

export const RecommendationBadge: Record<
  AIRecommendation,
  string
> = {
  "Strong Buy": "bg-emerald-600",
  Buy: "bg-green-600",
  Watch: "bg-cyan-600",
  Hold: "bg-yellow-600",
  Avoid: "bg-red-600",
};
