import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";

/**
 * BLOCKED — not implemented, and deliberately left that way.
 *
 * EvidencePackage (engine/evidence/package.ts) has no field this
 * analyst could analyze — "Knowledge" here would presumably draw on
 * engine/knowledge/ (a separate subsystem for structured facts), but
 * that subsystem isn't wired into EvidencePackage and this analyst
 * has no defined data contract to consume. The v2/KnowledgeBuilder
 * (also unwired) is the same story: `throw new Error("...not
 * implemented.")`.
 *
 * Before implementing: first decide what "Knowledge" evidence for a
 * single-company analyst report should actually contain — this needs
 * a product decision, not just a data-wiring fix.
 *
 * Not wired into CommitteeEngine (see engine/research/researchEngine.ts)
 * — confirmed zero impact on live committee output.
 */
export class KnowledgeAnalyst implements Analyst<EvidencePackage> {

  readonly name = "Knowledge Analyst";
  readonly version = "0.0.0-blocked";

  async analyze(
    _input: EvidencePackage
  ): Promise<AnalystReport> {

    throw new Error(
      "KnowledgeAnalyst is not implemented: no defined evidence " +
      "contract exists for it yet. See the comment at the top of " +
      "this file before wiring this into the committee."
    );

  }

}
