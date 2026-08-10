"use client";

import { useEffect, useState } from "react";
import { DemoEvent } from "@/lib/demo/events";
import { spacexDemo } from "@/lib/demo/spacex-demo";

export default function DemoPlayer() {
  const [events, setEvents] = useState<DemoEvent[]>([]);

  useEffect(() => {
    const timers = spacexDemo.map((event) =>
      setTimeout(() => {
        setEvents((current) => [...current, event]);
      }, event.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-8 py-16">

        <h1 className="text-5xl font-bold">
          AI Committee Experience
        </h1>

        <p className="mt-3 text-zinc-400">
          Live replay of an IPO Sniper AI investigation.
        </p>

        <div className="mt-10 space-y-5">

          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg"
            >
              <div className="text-blue-400 font-semibold">
                {event.title}
              </div>

              {event.description && (
                <div className="mt-2 text-zinc-300">
                  {event.description}
                </div>
              )}
            </div>
          ))}

        </div>

      </div>
    </main>
  );
}
