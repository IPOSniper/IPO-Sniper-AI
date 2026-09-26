export class FMPProfileProvider {

    async getSector(ticker: string): Promise<string | null> {

        const apiKey = process.env.FMP_API_KEY;
        if (!apiKey) return null;

        try {
            const url = `https://financialmodelingprep.com/stable/profile?apikey=${apiKey}&symbol=${ticker}`;
            const response = await fetch(url, { cache: "no-store" });
            if (!response.ok) return null;

            const data = await response.json();
            const entry = Array.isArray(data) ? data[0] : null;
            if (!entry || !entry.sector) return null;

            return entry.sector;
        } catch {
            return null;
        }
    }

}