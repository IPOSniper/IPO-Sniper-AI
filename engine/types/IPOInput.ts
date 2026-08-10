export interface IPOInput {
  ticker: string;
  company: string;
  exchange: string;
  price: string;
  shares?: number;
  value?: number;
}