import Link from "next/link";
import { IPO } from "../types/ipo";

type Props = {
  ipos: IPO[];
};

export default function UpcomingIPOCard({ ipos }: Props) {
  return (
    <div className="space-y-5">
      {ipos.map((ipo) => (
        <Link
          key={ipo.ticker}
          href={`/ipo/${ipo.ticker}`}
          className="block"
        >
          <div className="bg-slate-900 rounded-xl p-6 hover:bg-slate-800 transition-all hover:scale-[1.01]">

            <div className="flex justify-between items-start">

              <div className="flex-1">

                <h3 className="text-2xl font-bold">
                  {ipo.company}
                </h3>

                <p className="text-slate-400 mt-1">
                  {ipo.ticker} • IPO {ipo.date} • {ipo.price}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {ipo.analysis.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="bg-cyan-900 text-cyan-300 px-2 py-1 rounded text-xs"
                    >
                      {reason}
                    </span>
                  ))}
                </div>

              </div>

              <div className="text-right">

                <div
                  className={`text-2xl font-bold px-4 py-2 rounded-lg ${
                    ipo.analysis.score >= 90
                      ? "bg-green-500 text-black"
                      : ipo.analysis.score >= 80
                      ? "bg-yellow-400 text-black"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {ipo.analysis.score}
                </div>

                <div className="mt-2 text-cyan-400 font-semibold">
                  {ipo.analysis.recommendation}
                </div>

              </div>

            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 text-sm">

              <div>
                <p className="text-slate-500">Confidence</p>
                <p className="font-bold">
                  {ipo.analysis.confidence}%
                </p>
              </div>

              <div>
                <p className="text-slate-500">Expected</p>
                <p className="font-bold text-green-400">
                  {ipo.analysis.expectedReturn}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Risk</p>
                <p className="font-bold">
                  {ipo.analysis.risk}
                </p>
              </div>

            </div>

          </div>
        </Link>
      ))}
    </div>
  );
}