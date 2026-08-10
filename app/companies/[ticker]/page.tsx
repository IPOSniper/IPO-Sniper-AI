interface IPOPageProps {
  params: {
    ticker: string;
  };
}

export default async function IPOPage({ params }: IPOPageProps) {
  return (
    <main className="min-h-screen bg-[#081327] text-white p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold">
          {params.ticker.toUpperCase()}
        </h1>

        <p className="mt-3 text-cyan-400">
          Company Intelligence
        </p>

        <div className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/60 p-8">
          <h2 className="text-2xl font-semibold">
            Business Fundamentals
          </h2>

          <p className="mt-4 text-slate-300">
            This page will become the heart of IPO Sniper AI.
          </p>
        </div>
      </div>
    </main>
  );
}