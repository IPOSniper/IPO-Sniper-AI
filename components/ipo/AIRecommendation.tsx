import type { IPO } from "@/types/ipo";
import {
  RecommendationColors,
} from "@/types/recommendation";

interface AIRecommendationProps {
  ipo: IPO;
}

export default function AIRecommendation({
  ipo,
}: AIRecommendationProps) {
  const analysis = ipo.analysis;

  const recommendationClass =
    RecommendationColors[analysis.recommendation];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-cyan-400">
            AI Recommendation
          </p>

          <h2 className={`mt-2 text-4xl font-bold ${recommendationClass}`}>
            {analysis.recommendation}
          </h2>

          <p className="mt-2 text-zinc-400">
            {analysis.summary}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-950 p-5 text-center">
          <p className="text-xs uppercase text-zinc-500">
            AI Score
          </p>

          <p className="mt-1 text-5xl font-black text-cyan-400">
            {analysis.score}
          </p>

          <p className="mt-2 text-sm text-zinc-400">
            Grade {analysis.grade}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <Metric
          label="Confidence"
          value={`${analysis.confidence}%`}
        />
        <Metric
          label="Conviction"
          value={`${analysis.conviction}%`}
        />
        <Metric
          label="Risk"
          value={analysis.risk}
        />
      </div>

      {analysis.reasons.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-lg font-semibold text-white">
            Why the AI reached this conclusion
          </h3>

          <ul className="space-y-2">
            {analysis.reasons.map((reason) => (
              <li
                key={reason}
                className="flex gap-2 text-zinc-300"
              >
                <span className="text-cyan-400">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}