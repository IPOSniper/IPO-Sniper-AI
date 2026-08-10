export interface Evidence {
  id: string;

  category: string;

  title: string;

  summary: string;

  status: "Positive" | "Neutral" | "Negative";

  confidence: number;

  source?: string;
}
