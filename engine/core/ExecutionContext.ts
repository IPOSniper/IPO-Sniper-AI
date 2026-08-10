export interface ExecutionContext {

    ticker?: string;

    company?: string;

    news?: unknown[];

    financials?: unknown;

    portfolio?: unknown;

    sharedMemory: Map<string, unknown>;
}
