import type { EvidenceReference } from "./EvidenceReference";

export interface Finding {

    id: string;

    category: string;

    title: string;

    summary: string;

    score: number;

    confidence: number;

    references: EvidenceReference[];

}
