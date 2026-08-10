export function calculateStars(score: number): number {
  if (score >= 95) return 5;
  if (score >= 85) return 4;
  if (score >= 75) return 3;
  if (score >= 65) return 2;
  return 1;
}

export function calculateGrade(score: number) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

export function calculateConviction(score: number) {
  return Math.min(99, score + 4);
}

export function calculateConfidence(score: number) {
  return Math.min(99, score + 2);
}