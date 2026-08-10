import type { Finding } from "../evidence/models/Finding";
import type { EvidenceReference } from "../evidence/models/EvidenceReference";

export interface Claim {

    id: string;

    title: string;

    statement: string;

    confidence: number;

    supportingFindings: Finding[];

    opposingFindings: Finding[];

    references: EvidenceReference[];

}
