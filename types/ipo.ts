import type { AIAnalysis } from "../lib/ai/types";

export interface IPO {
  company: string;
  ticker: string;

  date: string;

  exchange: string | null;

  price: string;

  shares: number;

  value: number;

  analysis: AIAnalysis;
}