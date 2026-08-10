import { WorkstationShell } from "@/components/workstation/shell";
import { ResearchService } from "@/engine/services/ResearchService";

interface PageProps {
    params: Promise<{ ticker: string }>;
}

export default async function ResearchPage({ params }: PageProps) {

    const { ticker: rawTicker } = await params;
    const ticker = rawTicker.toUpperCase();

    const researchService = new ResearchService();

    try {
        const research = await researchService.load(ticker);

        return (
            <WorkstationShell
                research={research}
                ticker={ticker}
            />
        );
    } catch (error) {
        return (
            <div className="text-white">
                <h1 className="text-2xl font-bold text-red-400">
                    Couldn&apos;t analyze {ticker}
                </h1>
                <p className="mt-2 text-zinc-400">
                    {error instanceof Error ? error.message : "Something went wrong while running research."}
                </p>
                <a
                    href="/workstation"
                    className="mt-4 inline-block rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
                >
                    Back to Workstation
                </a>
            </div>
        );
    }
}
