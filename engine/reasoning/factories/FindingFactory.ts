import type { AnalysisResult } from "../../types/AnalysisResult";
import type { Finding } from "../../evidence/models/Finding";

export class FindingFactory {

    static fromAnalysisResult(

        category: string,

        title: string,

        result: AnalysisResult

    ): Finding {

        return {

            id: crypto.randomUUID(),

            category,

            title,

            summary: result.summary,

            score: result.score,

            confidence: result.confidence,

            references: []

        };

    }

}
