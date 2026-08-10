"use client";

import { useDemo } from "../DemoContext";

export default function ResearchPanel() {

  const { demo } = useDemo();

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

      <div className="flex items-center justify-between">

        <h2 className="text-lg font-semibold">
          Research Progress
        </h2>

        <span className="font-bold text-cyan-400">
          {demo.progress}%
        </span>

      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-zinc-800">

        <div
          className="h-full bg-cyan-400 transition-all duration-700"
          style={{ width: `${demo.progress}%` }}
        />

      </div>

      <p className="mt-5 text-sm text-zinc-500">

        {demo.completed
          ? "Research complete."
          : "AI Committee is conducting research..."}

      </p>

    </section>
  );
}
