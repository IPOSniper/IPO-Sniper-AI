export default function TopNav() {
  return (
    <nav className="flex items-center justify-between bg-slate-900 rounded-xl p-4 mb-8">

      <h2 className="text-2xl font-bold text-cyan-400">
        IPO Sniper AI
      </h2>

      <div className="flex gap-3">

        <button className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700">
          Dashboard
        </button>

        <button className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700">
          IPO Calendar
        </button>

        <button className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700">
          Watchlist
        </button>

        <button className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400">
          AI Scan
        </button>

      </div>

    </nav>
  );
}