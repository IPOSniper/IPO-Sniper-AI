export interface BusinessFundamentals {
  overall: {
    score: number;
    confidence: number;
    summary: string;
  };

  revenueGrowth: {
    score: number;
  };

  profitability: {
    score: number;
  };

  cashFlow: {
    score: number;
  };

  management: {
    score: number;
  };
}
