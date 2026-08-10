import { ResearchObject } from "./ResearchObject";

export interface ResearchViewModel{

    companyName:string;

    ticker:string;

    recommendation:string;

    convictionScore:number;

    confidence:number;

    executiveSummary:string;

    financialScore:number;

    valuationScore:number;

    generatedAt:string;

    research:ResearchObject;

}
