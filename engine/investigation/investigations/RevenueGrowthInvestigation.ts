import { KnowledgeFact } from "../../knowledge/contracts/KnowledgeFact";
import { BaseInvestigation } from "../base/BaseInvestigation";
import { InvestigationFinding } from "../findings/InvestigationFinding";

export class RevenueGrowthInvestigation extends BaseInvestigation {

    readonly id = "revenue_growth";

    readonly hypothesis =
        "Companies with strong revenue growth are higher quality investments.";

    public evaluate(
        facts: KnowledgeFact[]
    ): InvestigationFinding {

        const fact = this.findFact(
            facts,
            "revenue_growth"
        );

        const growth =
            typeof fact?.value === "number"
                ? fact.value
                : 0;

        let score = 30;

        if (growth >= 30) score = 95;
        else if (growth >= 20) score = 85;
        else if (growth >= 10) score = 75;
        else if (growth >= 0) score = 60;

        return {

            hypothesisId: this.id,

            passed: growth >= 20,

            score,

            // Was `fact ? 100 : 0` — checking whether the KnowledgeFact
            // OBJECT existed (findFact() always returns one if the id
            // matches, so this was always true regardless of data
            // quality), not whether the underlying data was real. Real
            // consequence: this investigation reported 100% confidence
            // for every company, always, even when built entirely on
            // evidence.financial.revenueHistory being a hardcoded empty
            // array (confidence: 0, verified: false at the source).
            confidence: fact?.confidence ?? 0,

            summary:
                `Revenue growth measured ${growth.toFixed(2)}%.`,

            supportingFacts:
                fact ? [fact.id] : [],

            contradictingFacts: [],

            assumptions: [],

            risks:
                growth < 10
                    ? ["Revenue growth is slowing."]
                    : [],

            monitoringItems: [

                "Quarterly revenue growth"

            ]

        };

    }

}
