import { CommitteeDecision } from "../../committee/contracts/CommitteeDecision";
import { InvestmentThesis } from "./contracts/InvestmentThesis";

export class InvestmentThesisEngine {

    public generate(
        committee: CommitteeDecision
    ): InvestmentThesis {

        return {

            recommendation:
                committee.recommendation as
                InvestmentThesis["recommendation"],

            conviction:
                committee.overallScore,

            executiveSummary:

                "Overall committee consensus is favorable based on the available evidence.",

            bullCase: [

                "Strong financial quality.",

                "Positive investigation results."

            ],

            bearCase: [

                "Further validation is still required."

            ],

            risks: [

                "Execution risk",

                "Macroeconomic uncertainty"

            ],

            catalysts: [

                "Upcoming earnings",

                "Future product announcements"

            ]

        };

    }

}
