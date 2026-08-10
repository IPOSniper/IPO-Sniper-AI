import { sampleCompany, sampleFundamentals } from "@/lib/mock/companyData";

export interface DashboardData {
  featuredCompany: {
    ticker: string;
    companyName: string;
    fundamentals: typeof sampleFundamentals;
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  return {
    featuredCompany: {
      ticker: sampleCompany.ticker,
      companyName: sampleCompany.name,
      fundamentals: sampleFundamentals,
    },
  };
}