import { ConvictionLevel } from "../enums/ConvictionLevel";

export interface AnalystConviction {

    analyst: string;

    title: string;

    level: ConvictionLevel;

    conviction: number;

    confidence: number;

    supportingEvidence: string[];

    contradictingEvidence: string[];

    assumptions: string[];

    unknowns: string[];

    monitoringItems: string[];

    summary: string;

}
