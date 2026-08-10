import { EngineRegistry } from "./EngineRegistry";
import { ExecutionContext } from "./ExecutionContext";
import { ExecutionResult } from "./ExecutionResult";
import { Workflow } from "./Workflow";

export class Runtime {

    constructor(

        private readonly registry: EngineRegistry

    ) {}

    async execute(

        workflow: Workflow,

        context: ExecutionContext

    ): Promise<ExecutionResult[]> {

        const results: ExecutionResult[] = [];

        for (const step of workflow.steps) {

            const engine = this.registry.get(step.engineId);

            const result = await engine.execute(context);

            results.push(result);
        }

        return results;
    }
}
