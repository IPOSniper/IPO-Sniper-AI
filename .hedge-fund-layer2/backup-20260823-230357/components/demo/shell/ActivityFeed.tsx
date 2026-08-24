"use client";

import { useDemo } from "../DemoContext";

export default function ActivityFeed() {

  const { demo } = useDemo();

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

      <h2 className="mb-5 text-lg font-semibold">
        Activity Feed
      </h2>

      <div className="space-y-3">

        {demo.activity.length === 0 && (

          <p className="text-sm text-zinc-500">
            Waiting for research...
          </p>

        )}

        {demo.activity.map((item) => (

          <div
            key={item.id}
            className="border-l-2 border-cyan-500 pl-3"
          >

            <div className="text-xs text-zinc-500">
              {item.time}
            </div>

            <div className="text-sm text-white">
              {item.message}
            </div>

          </div>

        ))}

      </div>

    </section>
  );
}
