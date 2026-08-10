import { InvestigationFinding } from "../../../investigation/findings/InvestigationFinding";

export interface FinancialAnalysisReport {

    analyst: string;

    findings: InvestigationFinding[];

    overallConfidence: number;

    summary: string;

}
