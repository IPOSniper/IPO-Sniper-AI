import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { AlpacaOptionsProvider, type OptionContract } from "@/engine/trading/providers/AlpacaOptionsProvider";

/**
 * Real Alpaca options chain data -- see AlpacaOptionsProvider.ts's
 * docstring for the base-URL distinction and the "not yet live-
 * tested" caveat. This panel is the data-foundation piece of the
 * broader Adaptive Options Engine proposal, not the prediction/
 * valuation/strategy layers -- it shows real strikes/IV/Greeks for
 * the nearest expiration, nothing more.
 *
 * Filters to the 2 strikes closest to the real current spot price
 * (one just above, one just below) for the nearest real expiration
 * date Alpaca has listed -- not the full chain, which can run to
 * hundreds of contracts for a liquid underlying and isn't useful to
 * scan visually on a research page.
 */
export default async function OptionsChainPanel({ research }: WorkstationPanelProps) {
    const { quote, company } = research.report.evidence;

    if (!quote.price.verified) return null;
    const spotPrice = quote.price.value;

    let contracts: OptionContract[] = [];
    let errorMessage: string | null = null;

    try {
        contracts = await new AlpacaOptionsProvider().getOptionChain(company.ticker);
    } catch (err) {
        errorMessage = err instanceof Error ? err.message : "Options chain unavailable.";
    }

    if (errorMessage) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h2 className="mb-2 text-sm font-semibold text-zinc-300">Options Chain</h2>
                <p className="text-xs text-zinc-600">{errorMessage} — check ALPACA_API_KEY_ID/ALPACA_SECRET_KEY, or this underlying may not have listed options.</p>
            </div>
        );
    }

    if (contracts.length === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h2 className="mb-2 text-sm font-semibold text-zinc-300">Options Chain</h2>
                <p className="text-xs text-zinc-600">No listed options found for {company.ticker}.</p>
            </div>
        );
    }

    const nearestExpiration = [...new Set(contracts.map(c => c.expirationDate))].sort()[0];
    const nearTerm = contracts.filter(c => c.expirationDate === nearestExpiration);

    const calls = nearTerm.filter(c => c.type === "call").sort((a, b) => Math.abs(a.strikePrice - spotPrice) - Math.abs(b.strikePrice - spotPrice));
    const puts = nearTerm.filter(c => c.type === "put").sort((a, b) => Math.abs(a.strikePrice - spotPrice) - Math.abs(b.strikePrice - spotPrice));

    const nearestCall = calls[0];
    const nearestPut = puts[0];

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">Options Chain — Nearest Expiration</h2>
                <span className="text-xs text-zinc-500">{nearestExpiration}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {nearestCall && (
                    <div className="rounded-lg border border-emerald-900/40 bg-zinc-950 p-3">
                        <p className="mb-1 text-[10px] uppercase tracking-wide text-emerald-400">Call — ${nearestCall.strikePrice.toFixed(2)} strike</p>
                        <p className="mb-2 select-all rounded bg-zinc-900 px-1.5 py-1 font-mono text-[10px] text-zinc-300" title="Click to select, then copy — this is the real contract symbol for placing an order">
                            {nearestCall.symbol}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <div>
                                <p className="text-zinc-500">Bid / Ask</p>
                                <p className="text-white">{nearestCall.bidPrice !== null ? `$${nearestCall.bidPrice.toFixed(2)}` : "—"} / {nearestCall.askPrice !== null ? `$${nearestCall.askPrice.toFixed(2)}` : "—"}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">IV</p>
                                <p className="text-white">{nearestCall.impliedVolatility !== null ? `${(nearestCall.impliedVolatility * 100).toFixed(1)}%` : "—"}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Delta</p>
                                <p className="text-white">{nearestCall.delta !== null ? nearestCall.delta.toFixed(3) : "—"}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Theta</p>
                                <p className="text-white">{nearestCall.theta !== null ? nearestCall.theta.toFixed(3) : "—"}</p>
                            </div>
                        </div>
                    </div>
                )}
                {nearestPut && (
                    <div className="rounded-lg border border-red-900/40 bg-zinc-950 p-3">
                        <p className="mb-1 text-[10px] uppercase tracking-wide text-red-400">Put — ${nearestPut.strikePrice.toFixed(2)} strike</p>
                        <p className="mb-2 select-all rounded bg-zinc-900 px-1.5 py-1 font-mono text-[10px] text-zinc-300" title="Click to select, then copy — this is the real contract symbol for placing an order">
                            {nearestPut.symbol}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <div>
                                <p className="text-zinc-500">Bid / Ask</p>
                                <p className="text-white">{nearestPut.bidPrice !== null ? `$${nearestPut.bidPrice.toFixed(2)}` : "—"} / {nearestPut.askPrice !== null ? `$${nearestPut.askPrice.toFixed(2)}` : "—"}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">IV</p>
                                <p className="text-white">{nearestPut.impliedVolatility !== null ? `${(nearestPut.impliedVolatility * 100).toFixed(1)}%` : "—"}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Delta</p>
                                <p className="text-white">{nearestPut.delta !== null ? nearestPut.delta.toFixed(3) : "—"}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Theta</p>
                                <p className="text-white">{nearestPut.theta !== null ? nearestPut.theta.toFixed(3) : "—"}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <p className="mt-2 text-[10px] text-zinc-600">
                Real Alpaca options data. This is the data foundation only — no prediction, valuation, or strategy layer is built on top of it yet.
            </p>
        </div>
    );
}
