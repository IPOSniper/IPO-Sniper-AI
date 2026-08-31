import Link from "next/link";

export default function Hero() {
  return (
    <section className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="mx-auto max-w-5xl px-6 text-center">

        <p className="mb-6 text-sm uppercase tracking-[0.35em] text-blue-400">
          Institutional Investment Intelligence
        </p>

        <h1 className="text-6xl font-bold tracking-tight">
          IPO Sniper AI
        </h1>

        <p className="mx-auto mt-8 max-w-3xl text-xl text-zinc-300">
          An AI research committee that examines the actual filings, financials,
          and market data behind a company -- and shows you exactly what it
          found, unfiltered.
        </p>

        <p className="mt-8 text-2xl font-semibold">
          Raw Data. Real Evidence. No Spin.
        </p>

        <div className="mt-12 flex justify-center gap-6">

          {/*
            Previously a bare <button> with no onClick/Link — did
            nothing on click. /workstation is correct here even
            though it's behind the auth gate: proxy.ts redirects an
            unauthenticated visitor to /login?redirectTo=/workstation,
            so they land there automatically after signing in.
          */}
          <Link
            href="/workstation"
            className="rounded-xl bg-blue-600 px-8 py-4 font-semibold hover:bg-blue-500 transition"
          >
            Start Research
          </Link>

          <Link
            href="/demo"
            className="rounded-xl border border-zinc-700 px-8 py-4 font-semibold hover:bg-zinc-900 transition"
          >
            Watch Demo
          </Link>

        </div>

      </div>
    </section>
  );
}
