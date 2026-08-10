"use client";

import { useDemo } from "../DemoContext";

export default function EvidencePanel() {

  const { demo } = useDemo();

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

      <h2 className="mb-5 text-lg font-semibold">
        Evidence
      </h2>

      <div className="space-y-3">

        {demo.evidence.length === 0 && (

          <p className="text-sm text-zinc-500">
            Waiting for evidence...
          </p>

        )}

        {demo.evidence.map((item) => (

          <div
            key={item.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
          >

            <div className="text-sm font-medium text-white">
              {item.title}
            </div>

            <div className="mt-1 text-cyan-400 font-semibold">
              {item.value}
            </div>

          </div>

        ))}

      </div>

    </section>
  );
}
