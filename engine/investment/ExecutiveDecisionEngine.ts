import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import {
    ExecutiveDecision
} from "../models/InvestmentDecisionReport";

export class ExecutiveDecisionEngine {

    build(
        committee: CommitteeReport
    ): ExecutiveDecision {

        return {

            recommendation:
                this.mapRecommendation(
                    committee.recommendation
                ),

            capitalAllocationScore:
                Math.round(
                    committee.overallScore
                ),

            confidence:
                Math.round(
                    committee.confidence
                ),

            summary:
                committee.summary

        };

    }

    private mapRecommendation(
        recommendation: string
    ): ExecutiveDecision["recommendation"] {

        switch (recommendation.toUpperCase()) {

            case "STRONG_BUY":
            case "STRONG BUY":
                return "Strong Buy";

            case "BUY":
                return "Buy";

            case "SELL":
                return "Sell";

            case "REDUCE":
                return "Reduce";

            case "HOLD":
            default:
                return "Hold";
        }

    }

}
