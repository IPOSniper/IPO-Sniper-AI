import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function RiskPanel({ research }: WorkstationPanelProps) {
    const { risks } = research.report;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="text-lg font-semibold">Risks</h2>

            {risks.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">
                    No risks flagged by any analyst with verified data.
                </p>
            ) : (
                <ul className="mt-3 space-y-2">
                    {risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                            <span className="mt-0.5 text-amber-400">⚠</span>
                            {risk}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
