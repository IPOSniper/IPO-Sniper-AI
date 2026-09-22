export interface PeerMultiples {
    ticker: string;
    peRatio: number | null;
    evToRevenue: number | null;
    evToEbitda: number | null;
}

export interface ComparableCompaniesResult {
    ticker: string;
    peers: PeerMultiples[];
    averagePE: number | null;
    averageEvToRevenue: number | null;
    averageEvToEbitda: number | null;
    medianPE: number | null;
    medianEvToRevenue: number | null;
    medianEvToEbitda: number | null;
    peerCount: number;
}

export class ComparableCompaniesEngine {

    async getPeers(ticker: string): Promise<string[]> {
        const apiKey = process.env.FINNHUB_API_KEY;
        if (!apiKey) return [];

        const res = await fetch(
            `https://finnhub.io/api/v1/stock/peers?symbol=${ticker}&token=${apiKey}`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) return [];

        const peers: string[] = await res.json();
        // Finnhub includes the input ticker itself in the result; exclude it.
        return peers.filter(p => p.toUpperCase() !== ticker.toUpperCase()).slice(0, 5);
    }

    private average(values: (number | null)[]): number | null {
        const real = values.filter((v): v is number => v !== null && !isNaN(v));
        if (real.length === 0) return null;
        return real.reduce((sum, v) => sum + v, 0) / real.length;
    }

    private median(values: (number | null)[]): number | null {
        const real = values.filter((v): v is number => v !== null && !isNaN(v)).sort((a, b) => a - b);
        if (real.length === 0) return null;
        const mid = Math.floor(real.length / 2);
        return real.length % 2 !== 0 ? real[mid] : (real[mid - 1] + real[mid]) / 2;
    }

    async build(ticker: string, getMultiplesForTicker: (t: string) => Promise<PeerMultiples>): Promise<ComparableCompaniesResult | null> {
        const peerTickers = await this.getPeers(ticker);
        if (peerTickers.length === 0) return null;

        const peers = await Promise.all(peerTickers.map(t => getMultiplesForTicker(t)));

        return {
            ticker,
            peers,
            averagePE: this.average(peers.map(p => p.peRatio)),
            averageEvToRevenue: this.average(peers.map(p => p.evToRevenue)),
            averageEvToEbitda: this.average(peers.map(p => p.evToEbitda)),
            medianPE: this.median(peers.map(p => p.peRatio)),
            medianEvToRevenue: this.median(peers.map(p => p.evToRevenue)),
            medianEvToEbitda: this.median(peers.map(p => p.evToEbitda)),
            peerCount: peers.length,
        };
    }
}
