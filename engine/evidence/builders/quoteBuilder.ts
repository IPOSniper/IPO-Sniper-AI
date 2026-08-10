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

        return {
            price: quoteResult.status === "fulfilled"
                ? { value: quoteResult.value.price, source, confidence: 95, verified: true, collectedAt: now }
                : { value: 0, source, confidence: 0, verified: false, collectedAt: now },

            changePercent: quoteResult.status === "fulfilled"
                ? { value: quoteResult.value.changePercent, source, confidence: 95, verified: true, collectedAt: now }
                : { value: 0, source, confidence: 0, verified: false, collectedAt: now },

            marketCap: marketCapResult.status === "fulfilled"
                ? { value: marketCapResult.value, source, confidence: 90, verified: true, collectedAt: now }
                : { value: 0, source, confidence: 0, verified: false, collectedAt: now },
        };
    }

}
