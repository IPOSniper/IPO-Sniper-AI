import type { EvidenceContext } from "../../evidence/models/EvidenceContext";
import type { BrainResult } from "./BrainResult";

import { PluginRegistry } from "../builders/PluginRegistry";
import { FindingPipeline } from "../builders/FindingPipeline";

export class AIBrain {

    private readonly pipeline: FindingPipeline;

    constructor(
        private readonly registry: PluginRegistry
    ) {

        this.pipeline = new FindingPipeline(registry);

    }

    async think(
        context: EvidenceContext
    ): Promise<BrainResult> {

        const start = performance.now();

        const findings =
            await this.pipeline.build(context);

        const executionTimeMs =
            performance.now() - start;

        return {

            findings,

            analyzerCount:
                this.registry.getAll().length,

            executionTimeMs,

            confidence:
                findings.length === 0
                    ? 0
                    : findings.reduce(
                        (sum, finding) => sum + finding.confidence,
                        0
                    ) / findings.length

        };

    }

}
