import type { ResearchReport } from "@/engine/models/ResearchReport";
import type { ResearchObject } from "@/engine/models/ResearchObject";
import type { InvestmentDecisionReport } from "@/engine/models/InvestmentDecisionReport";

export class ResearchAssembler {

    static assemble(
        report: ResearchReport,
        investmentDecision?: InvestmentDecisionReport
    ): ResearchObject {

        return {

            company: {
                ticker: report.ticker,
                name: report.companyName,
            },

            report,

            committee: report.committee,

            investmentDecision,

            confidence: report.confidence,

            conviction: {
                score: report.conviction,
                confidence: report.confidence,
            },

            runtime: {
                generatedAt: report.generatedAt,
                completedStages: investmentDecision ? [
                    "ResearchReport",
                    "Committee",
                    "InvestmentDecision",
                    "Assembler"
                ] : [
                    "ResearchReport",
                    "Committee",
                    "Assembler"
                ],
            },

            ui: {
                loading: false,
            },

        };

    }

}
