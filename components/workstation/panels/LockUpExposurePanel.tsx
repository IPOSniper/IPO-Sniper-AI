import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { extractLockUpInfo } from "@/engine/valuation/extractLockUpInfo";

export default async function LockUpExposurePanel({ research }: WorkstationPanelProps) {
    const result = await extractLockUpInfo(research.company.ticker);

    if (!result.found || !result.excerpt) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Lock-Up Exposure</h3>
                <p className="text-xs text-zinc-600">No S-1 lock-up disclosure could be located for this ticker.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Lock-Up Exposure</h3>
                <span className="text-[9px] text-zinc-600">Filed {result.filingDate}</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">{result.excerpt}...</p>
            <p className="mt-2 text-[9px] text-zinc-600">Excerpted from the S-1&apos;s Shares Eligible for Future Sale section - specific expiration dates and share counts are not yet parsed into structured data.</p>
            {result.filingUrl && (
                <a href={result.filingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[10px] text-violet-400 hover:underline">
                    Read the full S-1 filing on SEC EDGAR
                </a>
            )}
        </div>
    );
}
