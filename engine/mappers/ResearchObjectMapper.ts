import { ResearchAssembler } from "@/engine/ai/ResearchAssembler";
import type { InvestmentDecisionReport } from "@/engine/models/InvestmentDecisionReport";

export class ResearchObjectMapper {

    static map(report: any, investmentDecision?: InvestmentDecisionReport) {

        return ResearchAssembler.assemble(report, investmentDecision);

    }

}
