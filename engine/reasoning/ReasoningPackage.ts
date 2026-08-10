import type { Finding } from "../evidence/models/Finding";
import type { Claim } from "./Claim";
import type { Hypothesis } from "./Hypothesis";
import type { ReasoningResult } from "./ReasoningResult";

export interface ReasoningPackage {

    findings: Finding[];

    claims: Claim[];

    hypotheses: Hypothesis[];

    results: ReasoningResult[];

    convictionScore: number;

    confidence: number;

    trustScore: number;

    crossSourceAgreement: number;

}
