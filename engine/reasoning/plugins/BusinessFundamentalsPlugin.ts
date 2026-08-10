import { BusinessFundamentalsEngine } from "../../fundamentals/BusinessFundamentalsEngine";

import type { AnalyzerPlugin } from "../contracts/AnalyzerPlugin";
import type { AnalyzerResult } from "../contracts/AnalyzerResult";
import type { EvidenceContext } from "../../evidence/models/EvidenceContext";

import { FindingFactory } from "../factories/FindingFactory";

export class BusinessFundamentalsPlugin implements AnalyzerPlugin {

    id = "business.fundamentals";

    name = "Business Fundamentals";

    version = "1.0.0";

    private readonly engine =
        new BusinessFundamentalsEngine();

    async analyze(
        context: EvidenceContext
    ): Promise<AnalyzerResult> {

        const result =
            this.engine.analyze(
                context.financialStatements
            );

        return {

            analyzerId: this.id,

            analyzerName: this.name,

            version: this.version,

            findings: [

                FindingFactory.fromAnalysisResult(

                    "Business Fundamentals",

                    "Overall Fundamentals",

                    result.overall

                ),

                FindingFactory.fromAnalysisResult(

                    "Revenue",

                    "Revenue Growth",

                    result.revenue

                )

            ],

            confidence:
                result.overall.confidence,

            executionTimeMs: 0,

            warnings: []

        };

    }

}
