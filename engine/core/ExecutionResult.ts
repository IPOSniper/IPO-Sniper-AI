export interface ExecutionResult {

    success: boolean;

    confidence: number;

    summary: string;

    findings: unknown[];

    recommendations: string[];
}
