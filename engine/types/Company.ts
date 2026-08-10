export interface Company {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  description: string;
  website?: string;
  headquarters?: string;
  founded?: number;
  ceo?: string;
  employees?: number;
  ipoDate?: Date;
  marketCap?: number;
  enterpriseValue?: number;
}