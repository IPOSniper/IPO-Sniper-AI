import { ResearchObject } from "./ResearchObject";
import { ResearchViewModel } from "./ResearchViewModel";

export function toResearchViewModel(
    research: ResearchObject
): ResearchViewModel {

    return {

        companyName:
            research.company.name,

        ticker:
            research.company.ticker,

        recommendation:
            research.report.recommendation ?? "Pending",

        convictionScore:
            research.conviction.score,

        confidence:
            research.confidence,

        executiveSummary:
            research.report.executiveSummary ?? "No summary available.",

        financialScore:
            0,

        valuationScore:
            0,

        generatedAt:
            research.runtime.generatedAt.toISOString(),

        research,

    };

}
