import { ExecutionContext } from "./ExecutionContext";
import { ExecutionResult } from "./ExecutionResult";

export interface AIEngine {

    readonly id: string;

    readonly name: string;

    execute(
        context: ExecutionContext
    ): Promise<ExecutionResult>;
}
