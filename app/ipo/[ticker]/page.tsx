interface IPOPageProps {
  params: Promise<{
    ticker: string;
  }>;
}

export default async function IPOPage({ params }: IPOPageProps) {
  const { ticker } = await params;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-4xl font-bold">
          IPO: {ticker}
        </h1>

        <p className="mt-4 text-slate-400">
          🎉 Dynamic IPO route is working!
        </p>
      </div>
    </main>
  );
}