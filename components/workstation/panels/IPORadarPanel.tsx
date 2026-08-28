import Link from "next/link";
import { FinnhubIPOProvider, type IPOCalendarEntry } from "@/engine/evidence/providers/FinnhubIPOProvider";
import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";

interface EnrichedIPO extends IPOCalendarEntry {
 secFilingUrl: string | null;
}

async function resolveSecFilingUrl(ticker: string): Promise<string | null> {
 try {
 const provider = new SECEdgarProvider();
 const cik = await provider.getCIK(ticker);
 if (!cik) return null;

 const filing = await provider.findLatestFiling(cik, ["424B4", "S-1"]);
 if (!filing) return null;

 return provider.buildFilingUrl(cik, filing);
 } catch {
 return null;
 }
}

function formatShares(n: number): string {
 if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M shares`;
 if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K shares`;
 return `${n} shares`;
}

function formatValue(n: number): string {
 if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
 if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
 return `$${n.toLocaleString()}`;
}

export default async function IPORadarPanel() {
 const provider = new FinnhubIPOProvider();
 const ipos = await provider.getUpcomingIPOs(8);

 if (ipos.length === 0) {
 return (
 <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
 <h2 className="mb-2 text-sm font-semibold text-zinc-300">- IPO Radar</h2>
 <p className="text-xs text-zinc-500">No upcoming IPOs reported in the next 3 months, or data unavailable.</p>
 </div>
 );
 }

 const enriched: EnrichedIPO[] = [];
 for (const ipo of ipos) {
 const secFilingUrl = await resolveSecFilingUrl(ipo.symbol);
 enriched.push({ ...ipo, secFilingUrl });
 }

 return (
 <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
 <h2 className="mb-3 text-sm font-semibold text-zinc-300">- IPO Radar</h2>
 <div className="grid grid-cols-1 gap-3">
 {enriched.map(ipo => (
 <div
 key={`${ipo.symbol}-${ipo.date}`}
 className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
 >
 <div className="flex items-center justify-between">
 <span className="font-semibold text-white">{ipo.symbol}</span>
 <span className="text-[10px] uppercase tracking-wide text-zinc-500">{ipo.status || "Expected"}</span>
 </div>
 <p className="mt-1 text-xs text-zinc-400">{ipo.date}</p>

 <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
 <div>
 <span className="text-zinc-600">Price: </span>
 <span className="text-zinc-300">{ipo.price || "Not available"}</span>
 </div>
 <div>
 <span className="text-zinc-600">Shares: </span>
 <span className="text-zinc-300">{ipo.numberOfShares ? formatShares(ipo.numberOfShares) : "Not available"}</span>
 </div>
 <div className="col-span-2">
 <span className="text-zinc-600">Offering value: </span>
 <span className="text-zinc-300">{ipo.totalSharesValue ? formatValue(ipo.totalSharesValue) : "Not available"}</span>
 </div>
 </div>

 <div className="mt-2 flex gap-3 text-[11px]">
 <Link href={`/research/${ipo.symbol}`} className="text-violet-400 hover:text-violet-300">
 Research -
 </Link>
 {ipo.secFilingUrl ? (
 <a href={ipo.secFilingUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-300">
 SEC Filing -
 </a>
 ) : (
 <span className="text-zinc-700">SEC filing not found</span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
