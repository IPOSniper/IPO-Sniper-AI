import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";

export default function SystemLog({ research }: WorkstationPanelProps) {
    const { runtime } = research;

    const time = new Date(runtime.generatedAt).toLocaleTimeString();

    return (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 h-full">
            <h2 className="mb-3 text-lg font-semibold">System Log</h2>

            <ul className="space-y-1.5 font-mono text-xs text-zinc-500">
                {runtime.completedStages.map((stage, i) => (
                    <li key={stage}>
                        [{time}] {stage} stage completed{i === runtime.completedStages.length - 1 ? " — report ready" : ""}
                    </li>
                ))}
            </ul>
        </section>
    );
}
