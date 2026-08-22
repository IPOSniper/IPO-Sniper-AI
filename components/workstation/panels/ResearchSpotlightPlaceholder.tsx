export default function ResearchSpotlightPlaceholder() {
    return (
        <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Research Spotlight</p>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-[10px] uppercase text-zinc-600">
                            <th className="pb-1 font-medium">Ticker</th>
                            <th className="pb-1 font-medium">Recommendation</th>
                            <th className="pb-1 font-medium">Confidence</th>
                            <th className="pb-1 font-medium">Agreement</th>
                            <th className="pb-1 font-medium">Evidence</th>
                            <th className="pb-1 font-medium">Risk</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-zinc-800 text-zinc-700">
                            <td className="py-1.5 font-semibold text-zinc-600">----</td>
                            <td className="py-1.5">--</td>
                            <td className="py-1.5">--</td>
                            <td className="py-1.5">--</td>
                            <td className="py-1.5">--</td>
                            <td className="py-1.5">--</td>
                        </tr>
                    </tbody>
                </table>
                <p className="mt-2 text-[11px] text-zinc-700">No active research spotlight yet -- connecting in Layer 2.</p>
            </div>
        </div>
    );
}