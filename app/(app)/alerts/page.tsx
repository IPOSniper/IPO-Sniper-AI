import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

interface AlertRow {
    id: string;
    ticker: string;
    category: "sec_filing" | "price_move" | "news_spike";
    severity: "info" | "notable" | "material";
    headline: string;
    detail: string | null;
    source_url: string | null;
    created_at: string;
}

const SEVERITY_STYLE: Record<AlertRow["severity"], string> = {
    material: "border-red-800 bg-red-950/40 text-red-300",
    notable: "border-amber-800 bg-amber-950/30 text-amber-300",
    info: "border-zinc-800 bg-zinc-900 text-zinc-400",
};

const CATEGORY_LABEL: Record<AlertRow["category"], string> = {
    sec_filing: "SEC Filing",
    price_move: "Price Move",
    news_spike: "News Spike",
};

async function loadAlerts(): Promise<{ alerts: AlertRow[]; watchedCount: number; configured: boolean }> {
    if (!isSupabaseConfigured()) {
        return { alerts: [], watchedCount: 0, configured: false };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { alerts: [], watchedCount: 0, configured: true };

    const [{ data: watchlist }, { data: positions }] = await Promise.all([
        supabase.from("watchlist").select("ticker").eq("user_id", user.id),
        supabase.from("positions").select("ticker").eq("user_id", user.id),
    ]);

    const tickers = Array.from(new Set([
        ...(watchlist ?? []).map(r => r.ticker),
        ...(positions ?? []).map(r => r.ticker),
    ]));

    if (tickers.length === 0) {
        return { alerts: [], watchedCount: 0, configured: true };
    }

    const { data: alerts } = await supabase
        .from("alerts")
        .select("id, ticker, category, severity, headline, detail, source_url, created_at")
        .in("ticker", tickers)
        .order("created_at", { ascending: false })
        .limit(50);

    return { alerts: alerts ?? [], watchedCount: tickers.length, configured: true };
}

export default async function AlertsPage() {
    const { alerts, watchedCount, configured } = await loadAlerts();

    return (
        <main className="p-8 text-white">
            <h1 className="text-2xl font-bold">Alerts</h1>
            <p className="mt-1 text-sm text-zinc-500">
                What changed overnight for the {watchedCount} ticker{watchedCount === 1 ? "" : "s"} you&apos;re watching.
            </p>

            <div className="mt-6 max-w-2xl space-y-2">
                {!configured && (
                    <p className="text-sm text-zinc-500">Authentication is not configured.</p>
                )}

                {configured && watchedCount === 0 && (
                    <p className="text-sm text-zinc-500">
                        You&apos;re not watching anything yet. Add a ticker from a research report,
                        or hold a position, and the overnight watcher will start tracking it.
                    </p>
                )}

                {configured && watchedCount > 0 && alerts.length === 0 && (
                    <p className="text-sm text-zinc-500">
                        No alerts yet. The overnight watcher runs once nightly — check back
                        after it&apos;s had at least two nights of data to diff against.
                    </p>
                )}

                {alerts.map(alert => (
                    <div
                        key={alert.id}
                        className={`rounded-lg border px-4 py-3 ${SEVERITY_STYLE[alert.severity]}`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wide">
                                {alert.ticker} &middot; {CATEGORY_LABEL[alert.category]}
                            </span>
                            <span className="text-xs text-zinc-500">
                                {new Date(alert.created_at).toLocaleString()}
                            </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-white">{alert.headline}</p>
                        {alert.detail && <p className="mt-0.5 text-xs text-zinc-400">{alert.detail}</p>}
                        {alert.source_url && (
                            <a
                                href={alert.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-block text-xs text-cyan-400 hover:underline"
                            >
                                View source →
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </main>
    );
}
