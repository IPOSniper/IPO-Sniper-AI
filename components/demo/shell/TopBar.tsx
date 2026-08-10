export default function TopBar() {
  return (
    <header className="h-[72px] border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-8">

      <div>

        <h1 className="text-xl font-bold text-white">
          IPO Sniper AI
        </h1>

        <p className="text-sm text-zinc-500">
          AI Investment Committee
        </p>

      </div>

      <div className="text-right">

        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Research Target
        </div>

        <div className="mt-1 text-lg font-semibold text-cyan-400">
          SpaceX
        </div>

      </div>

    </header>
  );
}
