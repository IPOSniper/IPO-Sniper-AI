import type {
  Recommendation,
  Evidence,
  Assumption,
  Risk,
  MonitoringItem,
} from "./types";

export interface AnalystReport {
  analyst: string;
  recommendation: Recommendation;
  score: number;
  confidence: number;
  evidenceStrength: number;
  thesis: string;
  evidence: Evidence[];
  assumptions: Assumption[];
  risks: Risk[];
  unknowns: string[];
  monitoring: MonitoringItem[];
}