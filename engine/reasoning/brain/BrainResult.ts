import type { Finding } from "../../evidence/models/Finding";

export interface BrainResult {

    findings: Finding[];

    analyzerCount: number;

    executionTimeMs: number;

    confidence: number;

}
