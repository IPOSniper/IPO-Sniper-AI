import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { SECForm4Provider } from "@/engine/evidence/providers/SECForm4Provider";

const CODE_LABEL: Record<string, string> = {
 P: "Purchase",
 S: "Sale",
 A: "Grant/Award",
 F: "Tax withholding",
 M: "Option exercise",
 G: "Gift",
};

/**
 * Real SEC Form 4 insider transactions -- async Server Component,
 * same pattern as SnapshotPanel.tsx's new metrics fetch. Government
 * public data (SEC EDGAR), zero commercial-use ambiguity unlike the
 * news providers. NOT YET LIVE-TESTED -- see SECForm4Provider.ts's
 * docstring for the real caveat on XML field-name verification.
 */
export default async function InsiderActivityPanel({ research }: WorkstationPanelProps) {
 const { company } = research.report.evidence;
 const transactions = await new SECForm4Provider().getRecentInsiderTransactions(company.ticker, 8);

 if (transactions.length === 0) {
 return (
 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <h2 className="mb-2 text-sm font-semibold text-zinc-300">Insider Activity</h2>
 <p className="text-xs text-zinc-600">
 No recent Form 4 filings found, or SEC data unavailable - check SEC_EDGAR_USER_AGENT.
 </p>
 </div>
 );
 }

 return (
 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <div className="mb-3 flex items-center justify-between">
 <h2 className="text-sm font-semibold text-zinc-300">Insider Activity</h2>
 <span className="text-xs text-zinc-500">Real SEC Form 4 filings</span>
 </div>
 <div className="space-y-2">
 {transactions.map((t, i) => (
 <a
 key={i}
 href={t.filingUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center justify-between rounded-md bg-zinc-950 px-3 py-2 text-xs hover:bg-zinc-900"
 >
 <div>
 <span className="font-medium text-white">{t.insiderName}</span>
 {t.officerTitle && <span className="ml-1.5 text-zinc-500">({t.officerTitle})</span>}
 <span className="ml-2 text-zinc-500">{t.transactionDate}</span>
 </div>
 <div className="flex items-center gap-2">
 <span className={t.acquiredOrDisposed === "A" ? "text-emerald-400" : "text-red-400"}>
 {CODE_LABEL[t.transactionCode] ?? t.transactionCode}
 </span>
 {t.shares !== null && (
 <span className="text-zinc-400">
 {t.shares.toLocaleString()} sh
 {t.pricePerShare !== null && ` @ $${t.pricePerShare.toFixed(2)}`}
 </span>
 )}
 </div>
 </a>
 ))}
 </div>
 </div>
 );
}
