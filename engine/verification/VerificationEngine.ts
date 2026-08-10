import { ConflictDetector } from "./ConflictDetector";
import { SourceRegistry } from "./SourceRegistry";
import { TrustEngine } from "./TrustEngine";

import { VerificationRequest } from "./contracts/VerificationRequest";
import { VerificationResult } from "./contracts/VerificationResult";
import { VerificationStatus } from "./contracts/VerificationStatus";

export class VerificationEngine {

    private readonly trustEngine = new TrustEngine();
    private readonly sourceRegistry = new SourceRegistry();
    private readonly conflictDetector = new ConflictDetector();

    public verify(request: VerificationRequest): VerificationResult {

        const conflicts = this.conflictDetector.detect(request.evidence);

        const trustedSources = request.evidence
            .map(e => e.source)
            .filter(source => this.sourceRegistry.isTrusted(source));

        const trust = this.trustEngine.calculate(
            trustedSources.length === 0
                ? 25
                : (trustedSources.length / request.evidence.length) * 100,
            "Verification completed."
        );

        return {
            evidence: request.evidence,
            status:
                conflicts.length > 0
                    ? VerificationStatus.CONFLICTING
                    : VerificationStatus.VERIFIED,
            trust,
            conflicts,
            verifiedSources: trustedSources
        };

    }

}
