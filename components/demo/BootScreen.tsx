"use client";

import { useEffect, useState } from "react";
import { bootSequence, BootStep } from "@/lib/demo/scenes/BootScene";

export default function BootScreen() {
  const [lines, setLines] = useState<BootStep[]>([]);

  useEffect(() => {
    bootSequence.forEach((step) => {
      setTimeout(() => {
        setLines((prev) => [...prev, step]);
      }, step.delay);
    });
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="w-full max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950 p-8 font-mono text-green-400">

        {lines.map((step) => (

          <div key={step.id}>
            {">"} {step.text}
          </div>

        ))}

      </div>
    </div>
  );
}
