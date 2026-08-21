import { EvidenceBuilder } from "../types";
import { QuoteEvidence } from "../package";
import { FinnhubQuoteProvider } from "../providers/FinnhubQuoteProvider";
export class QuoteBuilder
    implements EvidenceBuilder<QuoteEvidence> {
    private readonly provider = new FinnhubQuoteProvider();
    async build(ticker: string): Promise<QuoteEvidence> {
        const now = new Date();
        const source = "FINNHUB" as const;
        const [quoteResult, marketCapResult] = await Promise.allSettled([
            this.provider.getQuote(ticker),
            this.provider.getMarketCap(ticker),
        ]);
        const hasRealPrice = quoteResult.status === "fulfilled" && quoteResult.value.price > 0;
        const hasRealMarketCap = marketCapResult.status === "fulfilled" && marketCapResult.value > 0;
        return {
            price: hasRealPrice
                ? { value: quoteResult.status === "fulfilled" ? quoteResult.value.price : 0, source, confidence: 95, verified: true, collectedAt: now }
                : { value: 0, source, confidence: 0, verified: false, collectedAt: now },
            changePercent: hasRealPrice
                ? { value: quoteResult.status === "fulfilled" ? quoteResult.value.changePercent : 0, source, confidence: 95, verified: true, collectedAt: now }
                : { value: 0, source, confidence: 0, verified: false, collectedAt: now },
            marketCap: hasRealMarketCap
                ? { value: marketCapResult.status === "fulfilled" ? marketCapResult.value : 0, source, confidence: 90, verified: true, collectedAt: now }
                : { value: 0, source, confidence: 0, verified: false, collectedAt: now },
        };
    }
}
