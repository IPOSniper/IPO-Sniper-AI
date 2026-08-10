import { CommitteeOpinion } from "./CommitteeOpinion";

export interface CommitteeDecision {

    overallScore: number;

    confidence: number;

    recommendation: string;

    opinions: CommitteeOpinion[];

}
