import type { EvidenceContext } from "../../evidence/models/EvidenceContext";
import type { Finding } from "../../evidence/models/Finding";

import { PluginRegistry } from "./PluginRegistry";

export class FindingPipeline {

    constructor(
        private readonly registry: PluginRegistry
    ) {}

    async build(
        context: EvidenceContext
    ): Promise<Finding[]> {

        const findings: Finding[] = [];

        for (const analyzer of this.registry.getAll()) {

            const result = await analyzer.analyze(context);

            findings.push(
                ...result.findings
            );

        }

        return findings;

    }

}
