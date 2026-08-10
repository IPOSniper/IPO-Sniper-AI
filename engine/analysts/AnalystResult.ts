import { Evidence } from "../committee";
import { Factor } from "../committee";

export interface AnalystResult {

  analyst: string;

  score: number;

  confidence: number;

  thesis: string;

  bullishFactors: Factor[];

  bearishFactors: Factor[];

  evidence: Evidence[];

}
