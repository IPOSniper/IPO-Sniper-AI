import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function InvestmentThesisCards({ research }: WorkstationPanelProps) {
    const idc = research.report.investorDecisionCenter?.value;

    if (!idc) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Investment Thesis</h3>
                <p className="text-xs text-zinc-600">Investment decision not yet computed.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Investment Thesis</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-center">
                    <div className="text-[10px] uppercase text-red-400">Bear Case</div>
                    <div className="mt-1 text-xs text-red-300">{idc.bearCase.scenario}</div>
                    <div className="mt-1 text-[10px] text-red-500">{idc.bearCase.probability}%</div>
                </div>
                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 text-center">
                    <div className="text-[10px] uppercase text-zinc-400">Base Case</div>
                    <div className="mt-1 text-xs text-zinc-200">{idc.baseCase.scenario}</div>
                    <div className="mt-1 text-[10px] text-zinc-500">{idc.baseCase.probability}%</div>
                </div>
                <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3 text-center">
                    <div className="text-[10px] uppercase text-emerald-400">Bull Case</div>
                    <div className="mt-1 text-xs text-emerald-300">{idc.bullCase.scenario}</div>
                    <div className="mt-1 text-[10px] text-emerald-500">{idc.bullCase.probability}%</div>
                </div>
            </div>
        </div>
    );
}
