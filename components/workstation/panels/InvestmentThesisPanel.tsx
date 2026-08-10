import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function InvestmentThesisPanel({ research }: WorkstationPanelProps) {
    const scoredReports = research.committee.reports.filter(r => r.confidence > 0);

    const bullCase = scoredReports.filter(
        r => r.recommendation === "BUY" || r.recommendation === "STRONG_BUY"
    );

    const bearCase = scoredReports.filter(
        r => r.recommendation === "SELL" || r.recommendation === "REDUCE"
    );

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-lg font-semibold">Investment Thesis</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <p className="mb-2 text-sm font-medium text-emerald-400">Bull Case</p>
                    {bullCase.length === 0 ? (
                        <p className="text-sm text-zinc-600">No bullish analysts.</p>
                    ) : (
                        <ul className="space-y-1.5 text-sm text-zinc-300">
                            {bullCase.map(r => (
                                <li key={r.analyst}>{r.thesis}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <p className="mb-2 text-sm font-medium text-red-400">Bear Case</p>
                    {bearCase.length === 0 ? (
                        <p className="text-sm text-zinc-600">No bearish analysts.</p>
                    ) : (
                        <ul className="space-y-1.5 text-sm text-zinc-300">
                            {bearCase.map(r => (
                                <li key={r.analyst}>{r.thesis}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
