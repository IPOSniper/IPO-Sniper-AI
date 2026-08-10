import type { EvidenceContext } from "../../evidence/models/EvidenceContext";
import type { AnalyzerResult } from "./AnalyzerResult";

export interface AnalyzerPlugin {

    id: string;

    name: string;

    version: string;

    analyze(
        context: EvidenceContext
    ): Promise<AnalyzerResult>;

}
