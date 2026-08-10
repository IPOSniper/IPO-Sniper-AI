import type { Claim } from "./Claim";

export interface Hypothesis {

    id: string;

    title: string;

    probability: number;

    supportingClaims: Claim[];

    opposingClaims: Claim[];

}
