export interface SecFilingItem {
    id: string;
    category: "sec";
    headline: string;
    snippet: string | null;
    source: string;
    url: string;
    publishedAt: string;
}

const RELEVANT_SEC_FORM_TYPES = ["S-1", "424B4", "8-K", "13F-HR"];

function decodeXmlEntities(s: string): string {
    return s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

export async function fetchSecFilings(revalidate: number): Promise<SecFilingItem[]> {
    const userAgent = process.env.SEC_EDGAR_USER_AGENT;
    if (!userAgent) return [];

    try {
        const results = await Promise.all(
            RELEVANT_SEC_FORM_TYPES.map(type =>
                fetch(
                    `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=${encodeURIComponent(type)}&company=&dateb=&owner=include&count=8&output=atom`,
                    { headers: { "User-Agent": userAgent }, next: { revalidate } }
                ).then(res => res.ok ? res.text() : null).catch(() => null)
            )
        );

        const items: SecFilingItem[] = [];

        results.forEach((xml, typeIndex) => {
            if (!xml) return;

            const entries = xml.split("<entry>").slice(1);

            entries.forEach((entry, i) => {
                const title = entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? "SEC filing";
                const link = entry.match(/<link[^>]*href="([^"]*)"/)?.[1] ?? "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent";
                const updated = entry.match(/<updated>([^<]*)<\/updated>/)?.[1] ?? new Date().toISOString();

                items.push({
                    id: `sec-${typeIndex}-${i}-${updated}`,
                    category: "sec" as const,
                    headline: decodeXmlEntities(title),
                    snippet: null,
                    source: "SEC EDGAR",
                    url: link,
                    publishedAt: updated,
                });
            });
        });

        return items;
    } catch {
        return [];
    }
}
