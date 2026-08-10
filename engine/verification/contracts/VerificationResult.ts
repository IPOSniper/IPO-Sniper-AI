import { Evidence } from "../../types/Evidence";
import { TrustScore } from "./TrustScore";
import { VerificationStatus } from "./VerificationStatus";

export interface VerificationResult {
    evidence: Evidence[];
    status: VerificationStatus;
    trust: TrustScore;
    conflicts: string[];
    verifiedSources: string[];
}
