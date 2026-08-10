import type { EvidencePackage } from "../../evidence/package";

import { KnowledgeEngine } from "../../knowledge/KnowledgeEngine";
import { InvestigationExecutor } from "../../investigation/executors/InvestigationExecutor";
import { InvestigationRegistry } from "../../investigation/registry/InvestigationRegistry";
import { FinancialInvestigationPlan } from "../../investigation/plans/FinancialInvestigationPlan";
import { FinancialAnalysisReport } from "./reports/FinancialAnalysisReport";

export class FinancialAnalyst {

    private readonly knowledgeEngine =
        new KnowledgeEngine();

    private readonly registry =
        new InvestigationRegistry();

    private readonly executor =
        new InvestigationExecutor(
            this.registry
        );

    public analyze(
        evidence: EvidencePackage
    ): FinancialAnalysisReport {

        const knowledge =
            this.knowledgeEngine.build(
                evidence
            );

        const findings =
            this.executor.execute(
                FinancialInvestigationPlan,
                knowledge.facts
            );

        const overallConfidence =
            findings.length === 0
                ? 0
                : findings.reduce(
                    (sum, finding) => sum + finding.confidence,
                    0
                ) / findings.length;

        return {

            analyst: "Financial Analyst",

            findings,

            overallConfidence,

            summary:
                findings.every(
                    finding => finding.passed
                )
                    ? "Financial due diligence passed."
                    : "Financial due diligence identified concerns."

        };

    }

}
