
import { IntelligenceReport } from "../../intelligence/contracts/IntelligenceReport";

import { ReasoningResult } from "./ReasoningResult";

export class ReasoningEngine {

    public evaluate(
        report: IntelligenceReport
    ): ReasoningResult {

        const confidence =
            report.score.confidence;

        const risks =
            report.findings
                .filter(f => f.impact === "Bearish")
                .map(f => f.title);

        const opportunities =
            report.findings
                .filter(f => f.impact === "Bullish")
                .map(f => f.title);

        return {

            overallConclusion:
                report.summary,

            confidence,

            thesisImpact:
                confidence >= 80
                    ? "Increase"
                    : confidence <= 40
                        ? "Decrease"
                        : "Neutral",

            risks,

            opportunities,

            reasoning: [

                {

                    title:
                        "Overall Intelligence",

                    question:
                        "What conclusion does the intelligence engine reach?",

                    answer:
                        report.summary,

                    evidence: [

                        "IntelligenceReport.summary",

                        "Composite Intelligence Score"

                    ],

                    confidence,

                    assumptions: [

                        "Input data is current",

                        "Financial metrics are accurate"

                    ],

                    conclusion:
                        report.summary

                }

            ],

            causalAnalysis: {

                primaryDrivers:
                    opportunities,

                secondaryDrivers:
                    risks,

                positiveCatalysts:
                    opportunities,

                negativeCatalysts:
                    risks,

                narrative:
                    report.summary,

                confidence

            },

            capitalAllocation: {

                score:
                    confidence,

                buybacks:
                    "Unknown",

                acquisitions:
                    "Unknown",

                debtManagement:
                    "Unknown",

                reinvestment:
                    "Unknown",

                shareholderAlignment:
                    "Undetermined"

            },

            scenarios: {

                bullCase:
                    "Positive execution of current strategy.",

                baseCase:
                    "Business performs in line with expectations.",

                bearCase:
                    "Execution weakens or macro conditions deteriorate.",

                expectedOutcome:
                    "Base Case",

                probability:
                    confidence

            },

            decisionConfidence: {

                score:
                    confidence,

                dataQuality:
                    confidence,

                evidenceStrength:
                    confidence,

                reasoningConsistency:
                    confidence,

                explanation:
                    "Confidence inherited from Intelligence Engine."

            },

            portfolioImpact: {

                diversificationImpact:
                    "Neutral",

                sectorExposure:
                    "No significant change.",

                liquidityImpact:
                    "Neutral",

                expectedVolatility:
                    confidence >= 75
                        ? "Moderate"
                        : "High",

                recommendation:
                    confidence >= 75
                        ? "Consider Increasing Exposure"
                        : "Continue Monitoring"

            }

        };

    }

}


