import { AIAnalysis } from "@/lib/ai/types";

interface Props {
  analysis: AIAnalysis;
}

export default function AIScoreCard({ analysis }: Props) {
  const scoreColor =
    analysis.score >= 90
      ? "text-green-500"
      : analysis.score >= 75
      ? "text-blue-500"
      : analysis.score >= 60
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="rounded-xl border bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-bold">AI Score</h2>

      <div className={`text-6xl font-extrabold ${scoreColor}`}>
        {analysis.score}
      </div>

      <div className="mt-2 text-lg">
        {"★".repeat(analysis.stars)}
      </div>

      <div className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Grade</span>
          <strong>{analysis.grade}</strong>
        </div>

        <div className="flex justify-between">
          <span>Recommendation</span>
          <strong>{analysis.recommendation}</strong>
        </div>

        <div className="flex justify-between">
          <span>Conviction</span>
          <strong>{analysis.conviction}%</strong>
        </div>

        <div className="flex justify-between">
          <span>Confidence</span>
          <strong>{analysis.confidence}%</strong>
        </div>

        <div className="flex justify-between">
          <span>Risk</span>
          <strong>{analysis.risk}</strong>
        </div>

        <div className="flex justify-between">
          <span>Expected Return</span>
          <strong>{analysis.expectedReturn}</strong>
        </div>
      </div>
    </div>
  );
}