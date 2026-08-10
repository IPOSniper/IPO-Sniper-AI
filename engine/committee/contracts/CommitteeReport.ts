import type { Recommendation } from "./types";
import type { AnalystReport } from "./AnalystReport";

export interface CommitteeReport {
  reports: AnalystReport[];
  recommendation: Recommendation;
  overallScore: number;
  confidence: number;
  agreement: number;
  summary: string;
  generatedAt: Date;
}
