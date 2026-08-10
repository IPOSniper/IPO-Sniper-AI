import { IntelligenceReport } from "../../intelligence/contracts/IntelligenceReport";
import { InvestmentThesis } from "../../brain/thesis/contracts/InvestmentThesis";
import { CommitteeDecision } from "../../committee/models/CommitteeDecision";

export interface CompanyIntelligenceReport {

    symbol: string;

    generatedAt: Date;

    intelligence: IntelligenceReport[];

    thesis: InvestmentThesis;

    committee: CommitteeDecision;

}
