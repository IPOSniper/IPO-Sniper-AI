export interface BlindSpot {
    topic: string;
    importance: number;
    coveredBy: string[];
    missingFrom: string[];
}
