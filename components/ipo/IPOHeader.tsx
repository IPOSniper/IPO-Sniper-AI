import type { IPO } from "@/types/ipo";

interface IPOHeaderProps {
  ipo: IPO;
}

export default function IPOHeader({ ipo }: IPOHeaderProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm font-medium text-cyan-400">
              {ipo.exchange}
            </span>

            <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
              {ipo.ticker}
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white">
            {ipo.company}
          </h1>

          <p className="mt-2 max-w-2xl text-zinc-400">
            AI-generated IPO research, catalysts, risks, and investment thesis.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-xl bg-zinc-950 p-5">
          <Metric
            label="IPO Date"
            value={ipo.date}
          />

          <Metric
            label="IPO Price"
            value={ipo.price}
          />

          <Metric
            label="Shares"
            value={ipo.shares.toLocaleString()}
          />

          <Metric
            label="Offering"
            value={`$${ipo.value.toLocaleString()}`}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}