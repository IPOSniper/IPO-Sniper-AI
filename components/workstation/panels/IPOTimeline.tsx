import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";
import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

const MILESTONE_FORMS = ["S-1", "S-1/A", "424B4"] as const;
const LABELS: Record<string, string> = {
    "S-1": "S-1 Registration Filed",
    "S-1/A": "S-1 Amendment",
    "424B4": "Final Prospectus (Pricing)",
};

export default async function IPOTimeline({ research }: WorkstationPanelProps) {
    const ticker = research.company.ticker;
    const provider = new SECEdgarProvider();
    const cik = await provider.getCIK(ticker);

    if (!cik) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">IPO Timeline</h3>
                <p className="text-xs text-zinc-600">No SEC filer record found for this ticker.</p>
            </div>
        );
    }

    const filings = await provider.getFilings(cik);
    const milestones = filings
        .filter(f => MILESTONE_FORMS.includes(f.formType as typeof MILESTONE_FORMS[number]))
        .sort((a, b) => new Date(a.filedAt).getTime() - new Date(b.filedAt).getTime());

    if (milestones.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">IPO Timeline</h3>
                <p className="text-xs text-zinc-600">No S-1 or prospectus filings found for this ticker.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">IPO Timeline</h3>
            <div className="space-y-2">
                {milestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                        <span className="w-24 shrink-0 text-zinc-600">{m.filedAt}</span>
                        <span className="text-zinc-300">{LABELS[m.formType] ?? m.formType}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
