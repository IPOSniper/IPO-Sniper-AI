import type { KnowledgePackage } from "./KnowledgePackage";
import { EvidenceRegistry } from "../registry/EvidenceRegistry";
import type { FinancialStatement } from "../../types/FinancialStatement";

export interface EvidenceContext {

    ticker: string;

    companyName: string;

    analysisDate: Date;

    registry: EvidenceRegistry;

    knowledge: KnowledgePackage;

    financialStatements: FinancialStatement[];

}
