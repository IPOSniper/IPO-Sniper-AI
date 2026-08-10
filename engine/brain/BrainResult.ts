import { Evidence } from "../types/Evidence";

export interface BrainResult {
  summary: {
    overallScore: number;
    conviction: number;
    recommendation: string;
    confidence: number;
  };

  analysis: {
    investmentThesis: string;
    bullCase: string;
    bearCase: string;
  };

  support: {
    strengths: string[];
    risks: string[];
    catalysts: string[];
    evidence: Evidence[];
  };
}