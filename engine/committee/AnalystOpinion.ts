import { Evidence } from "./Evidence";
import { Factor } from "./Factor";

export interface AnalystOpinion {
  analyst: string;

  score: number;

  confidence: number;

  thesis: string;

  bullishFactors: Factor[];

  bearishFactors: Factor[];

  evidence: Evidence[];
}
