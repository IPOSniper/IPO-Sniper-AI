import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

/**
 * Real fix: this analyst used to gate on revenueGuidance.confidence
 * alone, which depends on Finnhub's estimates endpoint (explicitly
 * documented as "untested live" in FinnhubEstimatesProvider.ts) --
 * so a real, verified, 16-year revenue history sitting right in the
 * same evidence package went unused whenever that one external
 * consensus-estimate call failed or returned nothing. Real historical
 * YoY growth (from financialStatementsBuilder, backfilled from real
 * SEC filings) is now the primary, always-checked signal. Guidance
 * is layered on top as a real enhancement when it's actually
 * available, never a blocking requirement.
 */
export class GrowthAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Growth Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const history = input.financial.revenueHistory.value;
    const guidance = input.financial.revenueGuidance.value;
    const hasGuidance = input.financial.revenueGuidance.confidence >= MIN_USABLE_CONFIDENCE;

    if (input.financial.revenueHistory.confidence < MIN_USABLE_CONFIDENCE || history.length < 2) {
      return insufficientDataReport(this.name, ["revenueHistory"]);
    }

    const lastActual = history[history.length - 1];
    const priorActual = history[history.length - 2];

    const yoyGrowth = priorActual !== 0
      ? ((lastActual - priorActual) / Math.abs(priorActual)) * 100
      : 0;

    // Guidance, when available, blends in as a secondary signal --
    // weighted less than the real historical trend, never required.
    const impliedGuidanceGrowth = hasGuidance && lastActual !== 0
      ? ((guidance - lastActual) / Math.abs(lastActual)) * 100
      : null;

    const blendedGrowth = impliedGuidanceGrowth !== null
      ? (yoyGrowth * 0.6) + (impliedGuidanceGrowth * 0.4)
      : yoyGrowth;

    const recommendation =
      blendedGrowth >= 40
        ? "STRONG_BUY"
        : blendedGrowth >= 20
        ? "BUY"
        : blendedGrowth >= 5
        ? "HOLD"
        : blendedGrowth >= -5
        ? "REDUCE"
        : "SELL";

    const score = Math.max(
      0,
      Math.min(100, Math.round(50 + blendedGrowth))
    );

    const confidence = hasGuidance
      ? Math.round(
          (input.financial.revenueHistory.confidence * 0.6) +
          (input.financial.revenueGuidance.confidence * 0.4)
        )
      : input.financial.revenueHistory.confidence;

    const thesis = impliedGuidanceGrowth !== null
      ? `Revenue grew ${yoyGrowth.toFixed(1)}% YoY (real historical data, ${history.length} periods). Consensus estimates imply ${impliedGuidanceGrowth.toFixed(1)}% forward growth.`
      : `Revenue grew ${yoyGrowth.toFixed(1)}% YoY across ${history.length} reported periods (real historical data). Forward consensus estimates not currently available -- verdict based on historical trend only.`;

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence,

      evidenceStrength: confidence,

      thesis,

      evidence: [
        {
          category: "Growth",
          metric: "YoY Revenue Growth",
          value: yoyGrowth,
          source: input.financial.revenueHistory.source,
          confidence: input.financial.revenueHistory.confidence,
          verified: input.financial.revenueHistory.verified,
          collectedAt: input.financial.revenueHistory.collectedAt
        },
        {
          category: "Growth",
          metric: "Revenue History",
          value: history,
          source: input.financial.revenueHistory.source,
          confidence: input.financial.revenueHistory.confidence,
          verified: input.financial.revenueHistory.verified,
          collectedAt: input.financial.revenueHistory.collectedAt
        },
        ...(impliedGuidanceGrowth !== null ? [{
          category: "Growth",
          metric: "Consensus-Implied Forward Growth",
          value: impliedGuidanceGrowth,
          source: input.financial.revenueGuidance.source,
          confidence: input.financial.revenueGuidance.confidence,
          verified: input.financial.revenueGuidance.verified,
          collectedAt: input.financial.revenueGuidance.collectedAt
        }] : [])
      ],

      assumptions: hasGuidance ? [
        {
          statement: "Revenue guidance reflects Wall Street consensus estimates, not company-issued guidance.",
          confidence: input.financial.revenueGuidance.confidence
        }
      ] : [],

      risks:
        yoyGrowth < 5
          ? [
              {
                category: "Growth",
                severity: yoyGrowth < 0 ? "HIGH" : "MEDIUM",
                description: "Historical revenue growth is slowing."
              }
            ]
          : [],

      unknowns: [
        ...(history.length < 4 ? ["Limited revenue history reduces trend reliability."] : []),
        ...(!hasGuidance ? ["Forward consensus estimates not currently available."] : [])
      ],

      monitoring: [
        {
          title: "Revenue Trend",
          description: "Monitor whether YoY revenue growth accelerates or decelerates in the next reported period.",
          priority: "HIGH"
        }
      ]

    };

  }

}