import { IntelligenceCategory } from "../models/IntelligenceCategory";
import { IntelligenceFinding } from "../models/IntelligenceFinding";
import { IntelligenceScore } from "../scoring/IntelligenceScore";

export interface IntelligenceReport {

    category: IntelligenceCategory;

    score: IntelligenceScore;

    findings: IntelligenceFinding[];

    summary: string;

    recommendation: string;

    generatedAt: Date;

}
