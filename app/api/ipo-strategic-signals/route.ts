import { NextResponse } from "next/server";
import { searchGdelt, buildStrategicSignalQuery } from "@/engine/evidence/providers/GDELTProvider";

/**
 * Step 2 of IPO Intelligence enrichment: a second, clearly separate
 * GDELT query family for strategic/institutional/financing signals.
 * Same seed watchlist as the IPO Watch/GDELT builders in
 * live-feed/route.ts -- Phase D (dynamic watchlist) still applies
 * equally here, not solved by this pass.
 *
 * status is always REPORTED, never "confirmed" -- a GDELT hit means a
 * report exists, not that a primary source verified the activity.
 * no_signal (checked, found nothing) is kept distinct from
 * unavailable/quota_exhausted (the check itself failed) -- never
 * conflated.
 */
const WATCHLIST = ["OpenAI", "Anthropic"];

export interface StrategicSignalCompany {
    company: string;
    status: "reported" | "no_signal" | "unavailable" | "quota_exhausted";
    headline: string | null;
    source: string | null;
    url: string | null;
    publishedAt: string | null;
    evidenceCount: number;
    error: string | null;
}

export const revalidate = 3600;

export async function GET() {
    const results = await Promise.all(
        WATCHLIST.map(async (company): Promise<StrategicSignalCompany> => {
            const result = await searchGdelt(buildStrategicSignalQuery(company), "7d", 10);

            if (result.status === "error") {
                const isQuota = result.error ? /quota|too many requests|rate limit/i.test(result.error) : false;
                return {
                    company,
                    status: isQuota ? "quota_exhausted" : "unavailable",
                    headline: null, source: null, url: null, publishedAt: null,
                    evidenceCount: 0,
                    error: result.error,
                };
            }

            if (result.articles.length === 0) {
                return {
                    company, status: "no_signal",
                    headline: null, source: null, url: null, publishedAt: null,
                    evidenceCount: 0, error: null,
                };
            }

            const latest = result.articles[0];
            return {
                company, status: "reported",
                headline: latest.title,
                source: latest.domain,
                url: latest.url,
                publishedAt: latest.publishedAt,
                evidenceCount: result.articles.length,
                error: null,
            };
        })
    );

    return NextResponse.json({ companies: results, fetchedAt: new Date().toISOString() });
}