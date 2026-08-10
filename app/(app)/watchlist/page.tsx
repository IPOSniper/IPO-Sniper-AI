import { getWatchlist } from "./actions";
import WatchlistManager from "@/components/watchlist/WatchlistManager";

export default async function WatchlistPage() {
    const watchlist = await getWatchlist();

    return (
        <main className="p-8 text-white">
            <h1 className="text-2xl font-bold">Watchlist</h1>
            <p className="mt-1 text-sm text-zinc-500">
                Tickers here (and anything you hold in Portfolio) get checked
                by the overnight watcher — see <a href="/alerts" className="text-cyan-400 hover:underline">Alerts</a>.
            </p>

            <div className="mt-6">
                <WatchlistManager initial={watchlist} />
            </div>
        </main>
    );
}
