export class FMPProfileProvider {

    async getSector(ticker: string): Promise<string | null> {

        const apiKey = process.env.FMP_API_KEY;
        if (!apiKey) return null;

        try {
            const url = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${apiKey}`;
            const response = await fetch(url, { cache: "no-store" });
            if (!response.ok) { console.error(`FMP profile request failed for ${ticker}: ${response.status} ${response.statusText}`); return null; }

            const data = await response.json();
            const entry = Array.isArray(data) ? data[0] : null;
            if (!entry || !entry.sector) { console.error(`FMP profile for ${ticker} has no usable entry/sector:`, JSON.stringify(data).slice(0, 300)); return null; }

            return entry.sector;
        } catch (err) { console.error(`FMP profile request threw for ${ticker}:`, err); return null;
        }
    }

}