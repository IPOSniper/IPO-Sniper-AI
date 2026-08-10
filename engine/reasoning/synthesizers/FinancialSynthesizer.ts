import { InvestigationReport } from "../../investigation/contracts/InvestigationReport";
import { ReasoningSection } from "../contracts/ReasoningSection";

export class FinancialSynthesizer {

    public synthesize(
        report: InvestigationReport
    ): ReasoningSection {

        const positives: string[] = [];
        const negatives: string[] = [];

        for (const finding of report.findings) {

            if (finding.passed) {

                positives.push(
                    finding.summary
                );

            } else {

                negatives.push(
                    finding.summary
                );

            }

        }

        return {

            title: "Financial Quality",

            score: report.overallScore,

            confidence: report.overallConfidence,

            narrative:

                positives.length > negatives.length

                    ? "Financial evidence is generally favorable."

                    : "Financial evidence is mixed or unfavorable.",

            positives,

            negatives

        };

    }

}
