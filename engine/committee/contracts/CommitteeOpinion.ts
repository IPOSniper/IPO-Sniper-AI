export interface CommitteeOpinion {

    member: string;

    score: number;

    confidence: number;

    vote: "Strong Buy" | "Buy" | "Hold" | "Sell";

    reasoning: string;

}
