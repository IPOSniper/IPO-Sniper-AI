export default function AIMarketBrief() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            AI Market Brief
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white">
            The market&apos;s momentum...
          </h2>

          <p className="mt-4 max-w-3xl text-slate-300 leading-7">
            Investors continue rotating into defensive sectors as
            expectations of future Federal Reserve rate cuts increase.
            Gold, utilities, and healthcare are attracting capital,
            while speculative growth companies are seeing lighter
            institutional demand.
          </p>

        </div>

        <div className="rounded-xl bg-cyan-500/10 px-6 py-5 text-center">

          <p className="text-sm uppercase text-cyan-300">
            AI Confidence
          </p>

          <p className="mt-2 text-5xl font-black text-cyan-400">
            87%
          </p>

        </div>

      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">

        <div>

          <h3 className="mb-4 text-lg font-semibold text-white">
            Capital Moving Into
          </h3>

          <ul className="space-y-3">

            <li className="text-green-400">
              ↑ Gold
            </li>

            <li className="text-green-400">
              ↑ Utilities
            </li>

            <li className="text-green-400">
              ↑ Defense
            </li>

            <li className="text-green-400">
              ↑ Healthcare
            </li>

          </ul>

        </div>

        <div>

          <h3 className="mb-4 text-lg font-semibold text-white">
            Capital Leaving
          </h3>

          <ul className="space-y-3">

            <li className="text-red-400">
              ↓ Speculative IPOs
            </li>

            <li className="text-red-400">
              ↓ Small Caps
            </li>

            <li className="text-red-400">
              ↓ High Growth Tech
            </li>

            <li className="text-red-400">
              ↓ Consumer Discretionary
            </li>

          </ul>

        </div>

      </div>

      <div className="mt-10 rounded-xl bg-slate-950 p-6">

        <h3 className="text-lg font-semibold text-white">
          Why This Matters
        </h3>

        <div className="mt-5 space-y-2 text-slate-300">

          <p>Federal Reserve Expectations</p>

          <p>↓</p>

          <p>Lower Bond Yields</p>

          <p>↓</p>

          <p>Institutional Portfolio Rotation</p>

          <p>↓</p>

          <p>Money Moves Into Defensive Sectors</p>

        </div>

      </div>

    </section>
  );
}