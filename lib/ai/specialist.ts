export interface AISpecialistResult {
  score: number;

  confidence: number;

  reasons: string[];

  warnings: string[];
}