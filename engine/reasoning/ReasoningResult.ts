import type { Finding } from "../evidence/models/Finding";
import type { EvidenceReference } from "../evidence/models/EvidenceReference";

export interface ReasoningResult {

    id: string;

    engine: string;

    title: string;

    summary: string;

    score: number;

    confidence: number;

    findings: Finding[];

    references: EvidenceReference[];

    metadata: {

        generated: Date;

        version: string;

    };

}
