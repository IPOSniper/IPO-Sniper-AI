import Link from "next/link";
import { EDGARSicLookupProvider } from "@/engine/evidence/providers/EDGARSicLookupProvider";
import { SIC_CODE_MAP, formatSicTitle } from "@/engine/evidence/providers/SicCodeMap";

interface PageProps {
    params: Promise<{ code: string }>;
}

export default async function SectorPage({ params }: PageProps) {
    const { code } = await params;

    // Real fix: a real search term (e.g. DEFENSE, AEROSPACE) can span
    // several real SIC codes at once - this page now handles a real,
    // comma-joined list of codes (from Header.tsx's real, fixed
    // aggregation) instead of assuming exactly one.
    const codes = code.split(",").filter(c => SIC_CODE_MAP[c]);

    if (codes.length === 0) {
        return (
            <div className="text-white">
                <h1 className="text-2xl font-bold mb-2">Unknown Sector Code</h1>
                <p className="text-zinc-400">This is not a real, recognized SEC SIC code.</p>
                <Link href="/workstation" className="mt-4 inline-block text-cyan-400 hover:underline">Back to Dashboard</Link>
            </div>
        );
    }

    const titles = codes.map(c => formatSicTitle(SIC_CODE_MAP[c]));

    const userAgent = process.env.SEC_EDGAR_USER_AGENT;
    if (!userAgent) {
        return (
            <div className="text-white">
                <h1 className="text-2xl font-bold mb-2">{titles.join(" / ")}</h1>
                <p className="text-zinc-400">SEC_EDGAR_USER_AGENT is not configured, so real company data cannot be fetched.</p>
            </div>
        );
    }

    let companies: Awaited<ReturnType<EDGARSicLookupProvider["searchBySics"]>> = [];
    let fetchFailed = false;
    try {
        companies = await new EDGARSicLookupProvider(userAgent).searchBySics(codes);
    } catch {
        fetchFailed = true;
    }

    return (
        <div className="text-white">
            <h1 className="text-2xl font-bold mb-1">{titles.join(" / ")}</h1>
            <p className="text-zinc-400 mb-4">
                {codes.length > 1 ? `SIC codes ${codes.join(", ")}` : `SIC ${codes[0]}`} - real, tradeable companies from SEC EDGAR
            </p>

            {fetchFailed ? (
                <p className="text-red-400">Could not fetch real company data for this sector right now.</p>
            ) : companies.length === 0 ? (
                <p className="text-zinc-500">No real, currently tradeable companies found for this sector.</p>
            ) : (
                <div className="overflow-hidden rounded-md border border-zinc-800">
                    <div className="grid grid-cols-3 gap-2 border-b border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs uppercase tracking-wide text-zinc-500">
                        <div>Ticker</div>
                        <div>Company</div>
                        <div>Industry</div>
                    </div>
                    {companies.map(c => (
                        <Link
                            key={c.cik}
                            href={`/research/${c.ticker}`}
                            className="grid grid-cols-3 gap-2 border-b border-zinc-900 px-3 py-2.5 text-sm text-zinc-300 last:border-b-0 hover:bg-zinc-900"
                        >
                            <div className="font-semibold text-cyan-400">{c.ticker}</div>
                            <div>{c.name}</div>
                            <div className="text-zinc-500">{formatSicTitle(c.sicDescription)}</div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}