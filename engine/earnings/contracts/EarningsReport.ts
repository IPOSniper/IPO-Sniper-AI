import { EarningsEvent } from "../models/EarningsEvent";
import { EarningsAnalysis } from "../models/EarningsAnalysis";

export interface EarningsReport {

    event: EarningsEvent;

    analysis: EarningsAnalysis;

}
