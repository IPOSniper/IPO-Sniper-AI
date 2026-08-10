import { BusinessFundamentalsResult } from "../fundamentals/BusinessFundamentalsEngine";

export interface FundamentalScore {
  score: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
}

export class FundamentalScoreEngine {
  score(fundamentals: BusinessFundamentalsResult): FundamentalScore {
    const score = 85;

    return {
      score,
      grade: "A",
      strengths: [],
      weaknesses: []
    };
  }
}
