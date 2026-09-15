import type { ResearchReport } from "./ResearchReport";
import type { CommitteeReport } from "@/engine/committee/contracts/CommitteeReport";
import type { InvestmentDecisionReport } from "./InvestmentDecisionReport";

export interface ResearchObject {

    company:{
        ticker:string;
        name:string;
    };

    report: ResearchReport;

    committee: CommitteeReport;

    // Optional: not every code path builds this yet (see
    // ResearchEngine.analyzeFull() vs the older .analyze()-only
    // callers). Panels reading this MUST handle it being undefined
    // with an honest "not available" state, not assume it exists.
    investmentDecision?: InvestmentDecisionReport;

    confidence:number;

    conviction:{
        score:number;
        confidence:number;
    };

    runtime:{
        generatedAt:Date;
        completedStages:string[];
    };

    researchSnapshot: {
        recommendation: string;
        conviction: number;
        confidence: number;
        agreement: number;
        analystCount: number;
        votingAnalystCount: number;
    };



    ui:{
        loading:boolean;
    };

}
