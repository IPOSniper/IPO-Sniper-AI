import { ARKHoldingsProvider } from "@/engine/evidence/providers/ARKHoldingsProvider";
import { XOVRHoldingsProvider } from "@/engine/evidence/providers/XOVRHoldingsProvider";
import {
 SEC13FProvider,
 NOTABLE_13F_FILERS,
 type NotableFilerKey,
} from "@/engine/evidence/providers/SEC13FProvider";
import { lookupCusip } from "@/engine/evidence/providers/CusipMap";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import UnverifiedCard from "../../shared/UnverifiedCard";

interface Props {
 ticker: string;
}

interface NotableHolder {
 filer: string;
 shares: number;
 valueThousands: number;
 periodOfReport: string;
}

async function getNotableHolders(
 ticker: string
): Promise<{ holders: NotableHolder[]; asOf: string } | null> {
 const mapped = lookupCusip(ticker);
 if (!mapped) return null;

 const userAgent = process.env.SEC_EDGAR_USER_AGENT;
 if (!userAgent) return null;

 const provider = new SEC13FProvider(userAgent);
 const filerKeys = Object.keys(NOTABLE_13F_FILERS) as NotableFilerKey[];

 const results = await Promise.all(
  filerKeys.map(async (key): Promise<NotableHolder | null> => {
   try {
    const filing = await provider.getLatestFiling(NOTABLE_13F_FILERS[key].cik);
    if (!filing) return null;

    const holding = filing.holdings.find((h) => h.cusip === mapped.cusip);
    if (!holding) return null;

    return {
     filer: NOTABLE_13F_FILERS[key].label,
     shares: holding.shares,
     valueThousands: holding.valueThousands,
     periodOfReport: filing.periodOfReport,
    };
   } catch {
    return null;
   }
  })
 );

 const holders = results.filter(
  (r): r is NotableHolder => r !== null
 );

 if (holders.length === 0) {
  return { holders: [], asOf: "" };
 }

 return {
  holders,
  asOf: holders[0].periodOfReport,
 };
}

async function getRecentSnapshot(
 ticker: string
): Promise<{ arkShares: number | null; date: string } | null> {
 if (!isSupabaseConfigured()) return null;

 const supabase = await createClient();
 const { data } = await supabase
  .from("evidence_snapshots")
  .select("ark_shares, snapshot_date")
  .eq("ticker", ticker)
  .order("snapshot_date", { ascending: false })
  .limit(2);

 if (!data || data.length < 2) return null;

 return {
  arkShares: data[1].ark_shares,
  date: data[1].snapshot_date,
 };
}

function OwnershipBar({
 label,
 shares,
 totalShares,
}: {
 label: string;
 shares: number;
 totalShares: number;
}) {
 const percentage =
  totalShares > 0 ? (shares / totalShares) * 100 : 0;

 return (
  <div className="space-y-1.5">
   <div className="flex items-center justify-between gap-3">
    <span className="min-w-0 truncate text-xs text-zinc-300">
     {label}
    </span>
    <span className="shrink-0 text-xs tabular-nums text-zinc-500">
     {shares.toLocaleString()} sh
    </span>
   </div>

   <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
    <div
     className="h-full rounded-full bg-zinc-400 transition-all"
     style={{ width: `${Math.min(percentage, 100)}%` }}
    />
   </div>

   <div className="text-right text-[10px] tabular-nums text-zinc-600">
    {percentage.toFixed(1)}% of reported ARK shares
   </div>
  </div>
 );
}

export default async function InstitutionalOwnershipCard({
 ticker,
}: Props) {
 const ark = new ARKHoldingsProvider();

 let positions: Awaited<
  ReturnType<ARKHoldingsProvider["findAcrossFunds"]>
 > = [];

 let fetchFailed = false;

 try {
  positions = await ark.findAcrossFunds(ticker);
 } catch {
  fetchFailed = true;
 }

 let xovr: Awaited<
  ReturnType<XOVRHoldingsProvider["findHolding"]>
 > = null;

 try {
  xovr = await new XOVRHoldingsProvider().findHolding(ticker);
 } catch {
  // XOVR parsing failures do not invalidate ARK or 13F coverage.
 }

 const notable = await getNotableHolders(ticker).catch(() => null);
 const mapped = lookupCusip(ticker);

 if (
  fetchFailed &&
  !xovr &&
  (!notable || notable.holders.length === 0)
 ) {
  return (
   <UnverifiedCard
    title="Institutional Ownership"
    reason="ARK holdings fetch failed - assets.ark-funds.com may be unreachable or changed format"
   />
  );
 }

 if (
  positions.length === 0 &&
  !xovr &&
  (!notable || notable.holders.length === 0)
 ) {
  const reason = mapped
   ? `Not currently held by any ARK Invest fund or XOVR, and not found in Berkshire/Pershing Square/Scion's latest 13F-HR (checked via CUSIP ${mapped.cusip}).`
   : "Not currently held by any ARK Invest fund or XOVR. (Berkshire/Ackman/Burry not checked - no verified CUSIP mapping for this ticker yet.)";

  return (
   <UnverifiedCard
    title="Institutional Ownership"
    reason={reason}
   />
  );
 }

 const totalShares = positions.reduce(
  (sum, p) => sum + p.holding.shares,
  0
 );

 const totalValue = positions.reduce(
  (sum, p) => sum + p.holding.marketValue,
  0
 );

 const prior = await getRecentSnapshot(ticker).catch(() => null);

 const change =
  prior?.arkShares != null && prior.arkShares > 0
   ? ((totalShares - prior.arkShares) / prior.arkShares) * 100
   : null;

 const sortedPositions = [...positions].sort(
  (a, b) => b.holding.shares - a.holding.shares
 );

 const sortedNotable = notable
  ? [...notable.holders].sort((a, b) => b.shares - a.shares)
  : [];

 return (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
   <div className="space-y-5">
    <div>
     <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
      Ownership
     </div>

     <h2 className="mt-1 text-sm font-semibold text-zinc-200">
      Institutional Ownership
     </h2>

     <p className="mt-1 text-xs text-zinc-500">
      Verified reported institutional positions available for {ticker}.
     </p>
    </div>

    {positions.length > 0 && (
     <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
       <div className="rounded-lg border border-zinc-800 bg-black/20 p-3">
        <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
         Reported ARK shares
        </div>

        <div className="mt-1 text-xl font-semibold tabular-nums text-white">
         {totalShares.toLocaleString()}
        </div>

        <div className="mt-0.5 text-xs text-zinc-500">
         ${ (totalValue / 1_000_000).toFixed(1) }M reported market value
        </div>
       </div>

       <div className="rounded-lg border border-zinc-800 bg-black/20 p-3">
        <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
         ARK day-over-day
        </div>

        {change !== null ? (
         <div
          className={`mt-1 text-xl font-semibold tabular-nums ${
           change > 0
            ? "text-emerald-400"
            : change < 0
             ? "text-red-400"
             : "text-zinc-300"
          }`}
         >
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}%
         </div>
        ) : (
         <div className="mt-1 text-sm font-medium text-zinc-400">
          Not available
         </div>
        )}

        <div className="mt-0.5 text-xs text-zinc-600">
         {change !== null
          ? `Compared with ${prior?.date}`
          : "Requires sufficient snapshot history"}
        </div>
       </div>
      </div>

      <div>
       <div className="mb-3 flex items-center justify-between">
        <div>
         <h3 className="text-xs font-semibold text-zinc-300">
          ARK fund distribution
         </h3>
         <p className="mt-0.5 text-[10px] text-zinc-600">
          Share of reported ARK holdings in this ticker
         </p>
        </div>
       </div>

       <div className="space-y-4">
        {sortedPositions.map((position) => (
         <OwnershipBar
          key={position.fund}
          label={position.fund}
          shares={position.holding.shares}
          totalShares={totalShares}
         />
        ))}
       </div>
      </div>
     </section>
    )}

    {xovr && (
     <section className="border-t border-zinc-800 pt-4">
      <div className="mb-3">
       <h3 className="text-xs font-semibold text-zinc-300">
        XOVR — ERShares
       </h3>
       <p className="mt-0.5 text-[10px] text-zinc-600">
        Reported fund position
       </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
       <div className="rounded-lg bg-black/20 p-3">
        <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
         Shares held
        </div>
        <div className="mt-1 text-sm font-semibold tabular-nums text-zinc-200">
         {xovr.sharesHeld !== null
          ? xovr.sharesHeld.toLocaleString()
          : "Private/SPV position"}
        </div>
       </div>

       <div className="rounded-lg bg-black/20 p-3">
        <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
         Fund weight
        </div>
        <div className="mt-1 text-sm font-semibold tabular-nums text-zinc-200">
         {xovr.weightPercent.toFixed(2)}%
        </div>
       </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
       <span className="text-zinc-500">Reported market value</span>
       <span className="tabular-nums text-zinc-300">
        ${(xovr.marketValue / 1_000_000).toFixed(1)}M
       </span>
      </div>
     </section>
    )}

    {notable && notable.holders.length > 0 && (
     <section className="border-t border-zinc-800 pt-4">
      <div className="mb-3">
       <h3 className="text-xs font-semibold text-zinc-300">
        Other 13F filers
       </h3>

       <p className="mt-0.5 text-[10px] text-zinc-600">
        {notable.asOf
         ? `Reported as of ${notable.asOf}`
         : "Reporting period unavailable"}
       </p>
      </div>

      <div className="space-y-4">
       {sortedNotable.map((holder) => (
        <OwnershipBar
         key={holder.filer}
         label={holder.filer}
         shares={holder.shares}
         totalShares={Math.max(
          ...sortedNotable.map((item) => item.shares),
          1
         )}
        />
       ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
       <table className="min-w-full text-left text-xs">
        <thead className="border-b border-zinc-800 bg-black/20 text-zinc-600">
         <tr>
          <th className="px-3 py-2 font-medium">Filer</th>
          <th className="px-3 py-2 text-right font-medium">Shares</th>
          <th className="px-3 py-2 text-right font-medium">Value</th>
         </tr>
        </thead>

        <tbody className="divide-y divide-zinc-800">
         {sortedNotable.map((holder) => (
          <tr key={holder.filer}>
           <td className="px-3 py-2 text-zinc-300">
            {holder.filer}
           </td>
           <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
            {holder.shares.toLocaleString()}
           </td>
           <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
            ${(holder.valueThousands / 1000).toFixed(1)}M
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
       13F filings can lag up to 45 days after quarter-end and may
       therefore be less current than ARK/XOVR figures.
      </p>
     </section>
    )}

    {mapped &&
     notable &&
     notable.holders.length === 0 &&
     (positions.length > 0 || xovr) && (
      <p className="border-t border-zinc-800 pt-3 text-[10px] text-zinc-600">
       Not currently held by Berkshire/Pershing Square/Scion per their
       latest 13F-HR.
      </p>
     )}

    <div className="border-t border-zinc-800 pt-3">
     <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
      Data integrity
     </div>

     <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">
      Ownership figures represent reported positions from the available
      institutional sources. Missing or unavailable coverage is not
      interpreted as zero ownership.
     </p>
    </div>
   </div>
  </div>
 );
}