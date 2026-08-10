export default function MarketHeader() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-slate-900 rounded-xl p-4">
        <p className="text-slate-400 text-sm">S&P 500</p>
        <h2 className="text-2xl font-bold text-green-400">6,420</h2>
      </div>

      <div className="bg-slate-900 rounded-xl p-4">
        <p className="text-slate-400 text-sm">NASDAQ</p>
        <h2 className="text-2xl font-bold text-green-400">22,300</h2>
      </div>

      <div className="bg-slate-900 rounded-xl p-4">
        <p className="text-slate-400 text-sm">VIX</p>
        <h2 className="text-2xl font-bold text-red-400">18.7</h2>
      </div>

      <div className="bg-slate-900 rounded-xl p-4">
        <p className="text-slate-400 text-sm">Hot IPOs</p>
        <h2 className="text-2xl font-bold text-cyan-400">6</h2>
      </div>

      <div className="bg-slate-900 rounded-xl p-4">
        <p className="text-slate-400 text-sm">Upcoming</p>
        <h2 className="text-2xl font-bold text-cyan-400">14</h2>
      </div>
    </div>
  );
}