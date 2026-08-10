import { Fundamentals } from "./Fundamentals";
import { InvestmentThesis } from "../brain/thesis/contracts/InvestmentThesis";

export interface ReasoningResult {
  companyId: string;
  generatedAt: Date;
  fundamentals: Fundamentals;
  thesis: InvestmentThesis;
  whatHappened: string;
  whyItMatters: string;
  whoBenefits: string[];
  whoLoses: string[];
  secondOrderEffects: string[];
  nextWatchItems: string[];
}
