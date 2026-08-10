import { InvestmentThesis } from "../brain/thesis/contracts/InvestmentThesis";
import { CommitteeDecision } from "./models/CommitteeDecision";

export class InvestmentCommittee {

    public evaluate(
        thesis: InvestmentThesis
    ): CommitteeDecision {

        return {

            thesis,

            conviction: thesis.conviction,

            recommendation: thesis.recommendation,

            consensus: 100,

            rationale: thesis.executiveSummary

        };

    }

}
