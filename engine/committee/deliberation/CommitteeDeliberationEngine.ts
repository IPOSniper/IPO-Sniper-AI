import { ReasoningReport } from "../../reasoning/contracts/ReasoningReport";

import { CommitteeDecision } from "../contracts/CommitteeDecision";

import { FinancialCommitteeMember } from "../members/FinancialCommitteeMember";

export class CommitteeDeliberationEngine {

    private readonly financial =
        new FinancialCommitteeMember();

    public deliberate(
        reasoning: ReasoningReport
    ): CommitteeDecision {

        const opinion =
            this.financial.vote(reasoning);

        return {

            overallScore: opinion.score,

            confidence: opinion.confidence,

            recommendation: opinion.vote,

            opinions: [

                opinion

            ]

        };

    }

}
