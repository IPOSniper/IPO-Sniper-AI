/**
 * Any institutional manager with >$100M in US equities must file a
 * quarterly Form 13F-HR with the SEC (13F.live lists ~7,000 of them,
 * including every well-known name investor — Buffett, Ackman, Burry,
 * Dalio, etc.). This is the general mechanism ARK's daily CSV is the
 * exception to, not the rule: 13F is quarterly and filed up to 45
 * days after quarter-end, so it's meaningfully stale compared to
 * ARK's near-daily disclosure. Be upfront about that lag in any UI
 * that shows this data — it's a real limitation, not a bug.
 *
 * IMPORTANT — CUSIP, not ticker: the 13F Information Table reports
 * holdings by CUSIP + issuer name, not ticker symbol (confirmed
 * against SEC's own XML technical spec). There's no free, reliable
 * CUSIP->ticker mapping built into this codebase yet, so this
 * provider surfaces `cusip` and `nameOfIssuer` as-is rather than
 * guessing a ticker. Matching a specific holding to a ticker you're
 * watching (the way OvernightWatcher does for ARK) needs that
 * mapping solved first — either a paid data source, or a hand-
 * maintained map for just the tickers you care about.
 *
 * Written against SEC's documented XML technical spec and observed
 * filing index structure, not run against them live (no network
 * access in the sandbox this was built in) — verify once you run it.
 */

export interface ThirteenFHolding {
    nameOfIssuer: string;
    cusip: string;
    valueThousands: number;
    shares: number;
}

export interface ThirteenFFiling {
    filedAt: string;
    periodOfReport: string; // quarter-end the holdings are as of
    holdings: ThirteenFHolding[];
}

/** Verified via SEC EDGAR filing search (Aug 2026). Add more as you confirm them —
 *  see the note on Chamath Palihapitiya / Social Capital below for why he's not here yet. */
export const NOTABLE_13F_FILERS = {
    BERKSHIRE_HATHAWAY: { cik: "0001067983", label: "Berkshire Hathaway (Warren Buffett)" },
    PERSHING_SQUARE: { cik: "0001336528", label: "Pershing Square Capital Management (Bill Ackman)" },
    SCION_ASSET_MANAGEMENT: {
        cik: "0001649339",
        label: "Scion Asset Management (Michael Burry)",
        // Burry deregistered Scion with the SEC in Nov 2025 — it may
        // stop filing 13Fs going forward. Handle "no recent filing"
        // as a real, expected state for this one, not an error.
    },
    // Chamath Palihapitiya: the CIK commonly found for him
    // (0001715450) is his PERSONAL insider-filer CIK for Form 3/4/5
    // (director/officer disclosures at specific companies, e.g.
    // ProKidney Corp) — that is NOT the same thing as a 13F
    // institutional-manager CIK, and I could not confirm one exists
    // for Social Capital as an entity. Don't add him here until
    // that's actually confirmed — search SEC EDGAR's full-text
    // search for "Social Capital" filtered to Form 13F-HR, or check
    // whether he discloses through a different vehicle entirely.
} as const;

export type NotableFilerKey = keyof typeof NOTABLE_13F_FILERS;

export class SEC13FProvider {

    constructor(private readonly userAgent: string) {}

    private headers() {
        return { "User-Agent": this.userAgent };
    }

    /** Most recent 13F-HR filing for a manager CIK, or null if none found / no longer filing. */
    async getLatestFiling(cik: string): Promise<ThirteenFFiling | null> {
        const paddedCik = cik.padStart(10, "0");

        const submissionsRes = await fetch(
            `https://data.sec.gov/submissions/CIK${paddedCik}.json`,
            { headers: this.headers(), cache: "no-store" }
        );
        if (!submissionsRes.ok) return null;

        const submissions = await submissionsRes.json();
        const recent = submissions.filings?.recent;
        if (!recent) return null;

        const index13F = (recent.form as string[]).findIndex(
            (f: string) => f === "13F-HR" || f === "13F-HR/A"
        );
        if (index13F === -1) return null; // not found, or (like Scion) no longer filing

        const accession: string = recent.accessionNumber[index13F];
        const filedAt: string = recent.filingDate[index13F];
        const periodOfReport: string = recent.reportDate?.[index13F] ?? filedAt;
        const accessionNoDashes = accession.replace(/-/g, "");
        const cikNoLeadingZeros = String(Number(cik));

        // Find the information table XML within this filing's folder —
        // its exact filename varies by filer/year, so list the folder
        // and match by pattern rather than hardcoding a name.
        const indexRes = await fetch(
            `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeros}/${accessionNoDashes}/index.json`,
            { headers: this.headers(), cache: "no-store" }
        );
        if (!indexRes.ok) return null;

        const index = await indexRes.json();
        const files: Array<{ name: string }> = index.directory?.item ?? [];
        const infoTableFile = files.find(f =>
            /infotable/i.test(f.name) && f.name.toLowerCase().endsWith(".xml")
        );
        if (!infoTableFile) return null;

        const xmlRes = await fetch(
            `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeros}/${accessionNoDashes}/${infoTableFile.name}`,
            { headers: this.headers(), cache: "no-store" }
        );
        if (!xmlRes.ok) return null;

        const xml = await xmlRes.text();

        return {
            filedAt,
            periodOfReport,
            holdings: this.parseInfoTable(xml),
        };
    }

    /** Lightweight regex parse of the <infoTable> entries — avoids adding an XML dependency. */
    private parseInfoTable(xml: string): ThirteenFHolding[] {
        const entries = xml.split(/<infoTable>/i).slice(1);

        return entries.map(entry => ({
            nameOfIssuer: this.extract(entry, "nameOfIssuer"),
            cusip: this.extract(entry, "cusip"),
            valueThousands: Number(this.extract(entry, "value")) || 0,
            shares: Number(this.extract(entry, "sshPrnamt")) || 0,
        })).filter(h => h.cusip);
    }

    private extract(xml: string, tag: string): string {
        const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"));
        return match?.[1]?.trim() ?? "";
    }
}
