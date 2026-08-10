export interface CommitteeVote{

    analyst:string;

    vote:"Bullish"|"Neutral"|"Bearish";

    confidence:number;

}

export interface CommitteeModel{

    votes:CommitteeVote[];

    finalRecommendation:string;

}
