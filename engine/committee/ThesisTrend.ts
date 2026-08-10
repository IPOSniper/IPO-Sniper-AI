export interface ThesisTrend {
  direction: "Strengthening" | "Stable" | "Weakening";

  previousConviction: number;

  currentConviction: number;

  changeReason: string;
}
