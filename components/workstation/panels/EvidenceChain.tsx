import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function EvidenceChain({
    research,
}: WorkstationPanelProps) {
    const reports = research.committee.reports ?? [];

    const evidenceCount = reports.reduce(
        (sum, report) =>
            sum +
            (report.evidence?.filter((item: { verified?: boolean }) => item.verified).length ?? 0),
        0
    );

    const thesisCount = reports.filter(
        (report) => typeof report.thesis === "string" && report.thesis.trim().length > 0
    ).length;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Explainability
            </div>

            <h3 className="mt-1 text-sm font-semibold text-zinc-200">
                Evidence → Analysis → Thesis
            </h3>

            <p className="mt-1 text-[11px] text-zinc-500">
                How the research session moves from verified evidence into analyst reasoning.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                        01 · Evidence
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-zinc-100">
                        {evidenceCount}
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-500">
                        verified analyst evidence items
                    </p>
                </div>

                <div className="relative rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                    <div className="hidden md:block absolute -left-3 top-1/2 h-px w-3 bg-zinc-700" />

                    <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                        02 · Analysis
                    </div>

                    <div className="mt-3 text-2xl font-semibold text-zinc-100">
                        {reports.length}
                    </div>

                    <p className="mt-1 text-[10px] text-zinc-500">
                        committee analyst reports
                    </p>
                </div>

                <div className="relative rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                    <div className="hidden md:block absolute -left-3 top-1/2 h-px w-3 bg-zinc-700" />

                    <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                        03 · Thesis
                    </div>

                    <div className="mt-3 text-2xl font-semibold text-zinc-100">
                        {thesisCount}
                    </div>

                    <p className="mt-1 text-[10px] text-zinc-500">
                        analyst theses present
                    </p>
                </div>
            </div>

            <div className="mt-5 rounded-lg border border-zinc-900 bg-black/40 p-4">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-600">
                        Traceability
                    </span>

                    <span className="text-[10px] text-zinc-500">
                        Evidence → Committee → Thesis
                    </span>
                </div>

                <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-900">
                    <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                            width: `${reports.length > 0 ? Math.min(100, (thesisCount / reports.length) * 100) : 0}%`,
                        }}
                    />
                </div>
            </div>

            <div className="mt-3 text-[10px] text-zinc-600">
                This visual summarizes the existing research objects; it does not create new evidence-to-thesis relationships.
            </div>
        </div>
    );
}