import { ExecutionContext } from "./ExecutionContext";
import { ExecutionResult } from "./ExecutionResult";
import { ResearchWorkflow } from "./ResearchWorkflow";
import { Workstation } from "./Workstation";

export class WorkflowRunner {

    constructor(

        private readonly workstation: Workstation

    ) {}

    async analyze(

        ticker: string

    ): Promise<ExecutionResult[]> {

        const context: ExecutionContext = {

            ticker,

            sharedMemory: new Map<string, unknown>()

        };

        return await this.workstation.execute(

            ResearchWorkflow.build(),

            context

        );
    }
}
