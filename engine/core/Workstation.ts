import { AIEngine } from "./AIEngine";
import { EngineRegistry } from "./EngineRegistry";
import { ExecutionContext } from "./ExecutionContext";
import { ExecutionResult } from "./ExecutionResult";
import { Runtime } from "./Runtime";
import { Workflow } from "./Workflow";

import { ResearchCapability } from "./capabilities/ResearchCapability";

export class Workstation {

    private readonly registry =
        new EngineRegistry();

    private readonly runtime =
        new Runtime(this.registry);

    constructor() {

        this.register(

            new ResearchCapability()

        );

    }

    register(
        engine: AIEngine
    ): void {

        this.registry.register(engine);

    }

    async execute(

        workflow: Workflow,

        context: ExecutionContext

    ): Promise<ExecutionResult[]> {

        return await this.runtime.execute(

            workflow,

            context

        );

    }

    getRegisteredEngines(): AIEngine[] {

        return this.registry.list();

    }

    engineCount(): number {

        return this.registry.count();

    }

}
