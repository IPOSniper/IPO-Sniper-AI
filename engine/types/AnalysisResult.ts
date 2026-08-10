import { Evidence } from "./Evidence";

export interface AnalysisResult {
  score: number;
  confidence: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  evidence: Evidence[];
}
