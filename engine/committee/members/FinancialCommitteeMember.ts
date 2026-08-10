import { ReasoningReport } from "../../reasoning/contracts/ReasoningReport";
import { CommitteeOpinion } from "../contracts/CommitteeOpinion";

export class FinancialCommitteeMember {

    public vote(
        reasoning: ReasoningReport
    ): CommitteeOpinion {

        const score = reasoning.overallScore;

        return {

            member: "Financial Committee",

            score,

            confidence: reasoning.confidence,

            vote:
                score >= 85
                    ? "Strong Buy"
                    : score >= 70
                    ? "Buy"
                    : score >= 55
                    ? "Hold"
                    : "Sell",

            reasoning: reasoning.summary

        };

    }

}
