"use client";

import { useDemo } from "../DemoContext";

export default function CommitteePanel() {

  const { demo } = useDemo();

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

      <h2 className="mb-5 text-lg font-semibold">
        AI Investment Committee
      </h2>

      <div className="space-y-4">

        {demo.committee.length === 0 && (

          <p className="text-sm text-zinc-500">
            Waiting for analyst recommendations...
          </p>

        )}

        {demo.committee.map((vote) => (

          <div
            key={vote.analyst}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >

            <div className="flex items-center justify-between">

              <h3 className="font-semibold">
                {vote.analyst}
              </h3>

              <span className="text-cyan-400 font-bold">
                {vote.recommendation}
              </span>

            </div>

            <div className="mt-2 text-sm text-zinc-400">
              Confidence: {vote.confidence}%
            </div>

            <p className="mt-3 text-sm text-zinc-300">
              {vote.reason}
            </p>

          </div>

        ))}

      </div>

    </section>
  );
}
