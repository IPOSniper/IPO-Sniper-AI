import { Narrative } from "./Narrative";
import { BlindSpot } from "./BlindSpot";
import { Contradiction } from "./Contradiction";
import { SourceScore } from "./SourceScore";

export interface NewsReport {
    narratives: Narrative[];
    blindSpots: BlindSpot[];
    contradictions: Contradiction[];
    sourceScores: SourceScore[];
    consensus: number;
    overallConfidence: number;
}
