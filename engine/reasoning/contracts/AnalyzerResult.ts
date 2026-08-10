import type { Finding } from "../../evidence/models/Finding";

export interface AnalyzerResult {

    analyzerId: string;

    analyzerName: string;

    version: string;

    findings: Finding[];

    confidence: number;

    executionTimeMs: number;

    warnings: string[];

}
