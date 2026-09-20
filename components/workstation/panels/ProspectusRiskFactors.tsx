import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { extractRiskFactors } from "@/engine/valuation/extractRiskFactors";

export default async function ProspectusRiskFactors({ research }: WorkstationPanelProps) {
    const result = await extractRiskFactors(research.company.ticker);

    if (!result.found || !result.excerpt) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Prospectus Risk Factors</h3>
                <p className="text-xs text-zinc-600">No S-1 Risk Factors section could be located for this ticker.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Prospectus Risk Factors</h3>
                <span className="text-[9px] text-zinc-600">Filed {result.filingDate}</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">{result.excerpt}...</p>
            {result.filingUrl && (
                <a href={result.filingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[10px] text-violet-400 hover:underline">
                    Read the full S-1 filing on SEC EDGAR
                </a>
            )}
        </div>
    );
}
