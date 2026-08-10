import type { EvidencePackage } from "../evidence/package";

export interface BrainContext {
    ticker: string;
    companyName: string;
    evidence: EvidencePackage;
    generatedAt: Date;
}
