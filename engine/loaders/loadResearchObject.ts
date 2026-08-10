import { ResearchEngine } from "@/engine/research/researchEngine";
import { ResearchObjectMapper } from "@/engine/mappers/ResearchObjectMapper";

const engine = new ResearchEngine();

export async function loadResearchObject(ticker:string){

    const report = await engine.analyze({
        ticker
    });

    return ResearchObjectMapper.map(report);

}
