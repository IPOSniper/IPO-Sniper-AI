const items = [
  "Overview",
  "Research",
  "Committee",
  "Evidence",
  "Financials",
  "Valuation",
  "News",
  "Settings"
];

export default function Sidebar() {
  return (
    <aside className="border-r border-zinc-800 bg-zinc-950 p-6">

      <div className="mb-6 text-xs uppercase tracking-[0.3em] text-zinc-500">
        Navigation
      </div>

      <nav className="space-y-2">

        {items.map((item) => (

          <button
            key={item}
            className="w-full rounded-lg px-4 py-3 text-left text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
          >
            {item}
          </button>

        ))}

      </nav>

    </aside>
  );
}
