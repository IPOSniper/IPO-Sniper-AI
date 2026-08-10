import { AIEngine } from "../AIEngine";
import { ExecutionContext } from "../ExecutionContext";
import { ExecutionResult } from "../ExecutionResult";

import { ResearchEngine } from "../../research/researchEngine";

export class ResearchCapability implements AIEngine {

    readonly id = "research";

    readonly name = "Research";

    private readonly engine =
        new ResearchEngine();

    async execute(
        context: ExecutionContext
    ): Promise<ExecutionResult> {

        if (!context.ticker) {

            throw new Error(
                "Research requires a ticker."
            );

        }

        // analyzeFull() builds evidence and runs the committee ONCE,
        // producing both the research report and the investment
        // decision report from the same underlying data — see its
        // doc comment in researchEngine.ts for why this matters
        // (previously nothing called analyzeInvestmentDecision() at
        // all, so Portfolio Impact/Capital Rotation/Risk Radar had
        // zero UI surface despite being real, working engine output).
        const { report, investmentDecision } =
            await this.engine.analyzeFull({

                ticker: context.ticker

            });

        return {

            success: true,

            confidence: 100,

            summary:
                "Research completed successfully.",

            findings: [

                report,

                investmentDecision

            ],

            recommendations: []

        };

    }

}
