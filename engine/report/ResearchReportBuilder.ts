import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import type { EvidencePackage } from "../evidence/package";
import type { ResearchReport } from "../models/ResearchReport";
import { ExecutiveSummarySynthesizer } from "../synthesis/ExecutiveSummarySynthesizer";

export class ResearchReportBuilder {

    private readonly synthesizer = new ExecutiveSummarySynthesizer();

    async build(
        ticker: string,
        companyName: string,
        committee: CommitteeReport,
        evidence: EvidencePackage
    ): Promise<ResearchReport> {

        // Real LLM synthesis if ANTHROPIC_API_KEY is configured,
        // strictly grounded in the already-computed committee data
        // (see ExecutiveSummarySynthesizer's doc comment for the
        // grounding rule). Falls back to the deterministic stats-
        // line summary — never blocks report generation, and never
        // silently produces an empty/broken summary if the API call
        // fails for any reason (rate limit, bad key, network).
        let executiveSummary: string;
        let executiveSummaryIsAIGenerated: boolean;

        try {
            executiveSummary = await this.synthesizer.synthesize(companyName, committee);
            executiveSummaryIsAIGenerated = true;
        } catch {
            executiveSummary = committee.summary;
            executiveSummaryIsAIGenerated = false;
        }

        return {

            ticker,

            companyName,

            recommendation: committee.recommendation,

            conviction: committee.overallScore,

            confidence: committee.confidence,

            committee,

            evidence,

            executiveSummary,

            executiveSummaryIsAIGenerated,

            catalysts: [...new Set(
                committee.reports
                    .filter(report => report.confidence > 0)
                    .flatMap(report => report.monitoring)
                    .filter(item => item.priority === "HIGH")
                    .map(item => item.title)
            )],

            risks: [...new Set(
                committee.reports
                    .filter(report => report.confidence > 0)
                    .flatMap(report => report.risks)
                    .map(risk => risk.description)
            )],

            generatedAt: new Date()

        };

    }

}
