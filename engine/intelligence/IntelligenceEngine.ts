import { IntelligenceReport } from "./contracts/IntelligenceReport";

export abstract class IntelligenceEngine {

    public abstract analyze(symbol: string): Promise<IntelligenceReport>;

}
