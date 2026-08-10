import type { EvidencePackage } from "../evidence/package";

import { KnowledgeFact } from "./contracts/KnowledgeFact";
import { KnowledgeReport } from "./contracts/KnowledgeReport";

import { RevenueGrowthInterpreter } from "./interpreters/RevenueGrowthInterpreter";
import { GrossMarginInterpreter } from "./interpreters/GrossMarginInterpreter";
import { KnowledgeCategory } from "./models/KnowledgeCategory";

export class KnowledgeEngine {

    private readonly revenueInterpreter =
        new RevenueGrowthInterpreter();

    private readonly grossMarginInterpreter =
        new GrossMarginInterpreter();

    public build(
        evidence: EvidencePackage
    ): KnowledgeReport {

        const facts: KnowledgeFact[] = [];

        //
        // Revenue
        //

        const revenue =
            this.revenueInterpreter.interpret(
                evidence.financial.revenueHistory.value
            );

        facts.push({

            id: "revenue_growth",

            category: KnowledgeCategory.Revenue,

            name: "Revenue Growth",

            description: revenue.summary,

            // Was revenue.accelerating (a boolean) — RevenueGrowthInvestigation
            // reads this expecting a NUMBER (typeof fact?.value === "number"),
            // so the type mismatch meant it silently fell back to 0 every
            // single time, for every company, regardless of the real
            // computed growth rate. The "accelerating" narrative is still
            // captured in `description` above via revenue.summary.
            value: revenue.averageGrowthRate,

            confidence: revenue.confidence,

            evidence:
                revenue.quarterlyGrowthRates.map(
                    rate => `${rate.toFixed(2)}%`
                )

        });

        //
        // Gross Margin
        //

        const grossMargin =
            this.grossMarginInterpreter.interpret(
                evidence.financial.grossMarginHistory.value
            );

        facts.push({

            id: "gross_margin",

            category: KnowledgeCategory.Profitability,

            name: "Gross Margin",

            description: grossMargin.summary,

            // Same fix as revenue_growth above: was grossMargin.improving
            // (boolean), now the actual number. Not currently consumed by
            // any investigation in FinancialInvestigationPlan (only
            // revenue_growth is registered there), but fixing the same
            // latent bug shape now rather than rediscovering it whenever
            // a gross-margin investigation gets added.
            value: grossMargin.averageMargin,

            confidence: grossMargin.confidence,

            evidence: [
                `${grossMargin.averageMargin.toFixed(2)}%`
            ]

        });

        const overallConfidence =
            facts.length === 0
                ? 0
                : facts.reduce(
                    (sum, fact) =>
                        sum + fact.confidence,
                    0
                ) / facts.length;

        return {

            facts,

            overallConfidence

        };

    }

}

