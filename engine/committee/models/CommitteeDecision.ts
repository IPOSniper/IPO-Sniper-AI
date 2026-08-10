import { InvestmentThesis } from "../../brain/thesis/contracts/InvestmentThesis";

export interface CommitteeDecision {

    thesis: InvestmentThesis;

    conviction: number;

    recommendation: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";

    consensus: number;

    rationale: string;

}
