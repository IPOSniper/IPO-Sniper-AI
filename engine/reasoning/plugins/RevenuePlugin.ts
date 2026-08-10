import { RevenueAnalyzer } from "../../fundamentals/RevenueAnalyzer";

import type { AnalyzerPlugin } from "../contracts/AnalyzerPlugin";
import type { AnalyzerResult } from "../contracts/AnalyzerResult";
import type { EvidenceContext } from "../../evidence/models/EvidenceContext";

export class RevenuePlugin implements AnalyzerPlugin {

    id = "financial.revenue";

    name = "Revenue Analyzer";

    version = "1.0.0";

    private readonly analyzer = new RevenueAnalyzer();

    async analyze(
        context: EvidenceContext
    ): Promise<AnalyzerResult> {

        const result = this.analyzer.analyze(
            context.financialStatements
        );

        return {
            analyzerId: this.id,
            analyzerName: this.name,
            version: this.version,
            findings: [],
            confidence: result.confidence,
            executionTimeMs: 0,
            warnings: []
        };

    }

}
