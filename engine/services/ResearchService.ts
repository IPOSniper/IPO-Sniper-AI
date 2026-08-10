import { WorkflowRunner } from "@/engine/core/WorkflowRunner";
import { Workstation } from "@/engine/core/Workstation";

import { ResearchObject } from "@/engine/models/ResearchObject";
import { ResearchObjectMapper } from "@/engine/mappers/ResearchObjectMapper";

export class ResearchService {

    private readonly runner =
        new WorkflowRunner(
            new Workstation()
        );

    async load(
        ticker: string
    ): Promise<ResearchObject> {

        const results =
            await this.runner.analyze(
                ticker
            );

        const report =
            results[0].findings[0];

        const investmentDecision =
            results[0].findings[1];

        return ResearchObjectMapper.map(
            report,
            investmentDecision as any
        );

    }

}
