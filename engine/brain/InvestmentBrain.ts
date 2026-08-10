import type { BrainContext } from "./BrainContext";
import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import type { EvidencePackage } from "../evidence/package";

import { CommitteeEngine } from "../committee/committeeEngine";

export class InvestmentBrain {

    constructor(
        private readonly committee: CommitteeEngine<EvidencePackage>
    ) {}

    async analyze(
        context: BrainContext
    ): Promise<CommitteeReport> {

        return this.committee.analyze(
            context.evidence
        );

    }

}
