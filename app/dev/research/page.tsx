import ResearchInspector from "@/components/dev/ResearchInspector";
import { ResearchService } from "@/engine/services/ResearchService";

interface PageProps {
    searchParams: Promise<{ ticker?: string }>;
}

export default async function Page({ searchParams }: PageProps) {

    const { ticker } = await searchParams;

    const researchService =
        new ResearchService();

    const research =
        await researchService.load(ticker?.toUpperCase() || "RKLB");

    return (

        <ResearchInspector
            research={research}
        />

    );

}
