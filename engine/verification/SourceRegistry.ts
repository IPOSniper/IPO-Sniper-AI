export class SourceRegistry {

    private readonly trustedSources = new Set<string>([
        "SEC",
        "EDGAR",
        "NASDAQ",
        "NYSE",
        "Finnhub",
        "Polygon",
        "AlphaVantage"
    ]);

    public isTrusted(source: string): boolean {
        return this.trustedSources.has(source);
    }

    public add(source: string): void {
        this.trustedSources.add(source);
    }

}
