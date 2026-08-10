import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

export class CashFlowAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Cash Flow Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    const operatingCashFlow = input.financial.operatingCashFlow.value;
    const freeCashFlow = input.financial.freeCashFlow.value;

    if (input.financial.freeCashFlow.confidence < MIN_USABLE_CONFIDENCE) {
      return insufficientDataReport(this.name, ["operatingCashFlow", "freeCashFlow"]);
    }


    // FCF margin isn't available without revenue here, so recommendation
    // is driven by sign and relative size of FCF vs OCF (capex burden).
    const recommendation =
      freeCashFlow > 0 && freeCashFlow >= operatingCashFlow * 0.5
        ? "STRONG_BUY"
        : freeCashFlow > 0
        ? "BUY"
        : freeCashFlow === 0
        ? "HOLD"
        : freeCashFlow > operatingCashFlow * -0.5
        ? "REDUCE"
        : "SELL";

    const score =
      freeCashFlow > 0
        ? Math.max(50, Math.min(100, 50 + Math.round(freeCashFlow / 1_000_000)))
        : Math.max(0, Math.min(50, 50 + Math.round(freeCashFlow / 1_000_000)));

    const confidence = Math.round(
      (input.financial.operatingCashFlow.confidence +
        input.financial.freeCashFlow.confidence) / 2
    );

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence,

      evidenceStrength: confidence,

      thesis:
        `Free cash flow is ${freeCashFlow >= 0 ? "positive" : "negative"} at ${freeCashFlow.toLocaleString()}, against operating cash flow of ${operatingCashFlow.toLocaleString()}.`,

      evidence: [
        {
          category: "Cash Flow",
          metric: "Free Cash Flow",
          value: freeCashFlow,
          source: input.financial.freeCashFlow.source,
          confidence: input.financial.freeCashFlow.confidence,
          verified: input.financial.freeCashFlow.verified,
          collectedAt: input.financial.freeCashFlow.collectedAt
        },
        {
          category: "Cash Flow",
          metric: "Operating Cash Flow",
          value: operatingCashFlow,
          source: input.financial.operatingCashFlow.source,
          confidence: input.financial.operatingCashFlow.confidence,
          verified: input.financial.operatingCashFlow.verified,
          collectedAt: input.financial.operatingCashFlow.collectedAt
        }
      ],

      assumptions: [],

      risks:
        freeCashFlow < 0
          ? [
              {
                category: "Cash Flow",
                severity: freeCashFlow < operatingCashFlow * -0.5 ? "HIGH" : "MEDIUM",
                description: "Company is burning cash on a free cash flow basis."
              }
            ]
          : [],

      unknowns: [],

      monitoring: [
        {
          title: "Free Cash Flow Trend",
          description: "Monitor future quarterly cash burn or generation.",
          priority: "HIGH"
        }
      ]

    };

  }

}
