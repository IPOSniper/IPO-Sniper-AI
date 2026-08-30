"use client";

import { useEffect, useState } from "react";

/**
 * Web equivalent of the mobile app's BootSequence -- same visual
 * language (Evidence/Analysis/Conviction, purple/blue/teal), same
 * staggered-fill timing. Deliberately isolated: this file, plus
 * SessionBootGate.tsx, are the only two things touched to add this
 * feature. Nothing in the existing app/layout/pages is modified
 * except one wrapper line in layout.tsx around {children}.
 *
 * This is a decorative startup sequence, not a live system check --
 * "INTELLIGENCE ENGINE ONLINE" does not mean any real provider or
 * evidence system was actually verified in these 5 seconds. Never
 * describe it as one.
 */

const theme = {
  background: "#070A10",
  surface: "#111722",
  border: "#252E3D",
  text: "#F5F7FA",
  muted: "#8792A5",
  purple: "#8B5CF6",
  blue: "#65A9FF",
  teal: "#2DD4BF",
};

interface StageDef {
  key: "evidence" | "analysis" | "conviction";
  label: string;
  description: string;
  color: string;
  delayMs: number;
}

const STAGES: StageDef[] = [
  {
    key: "evidence",
    label: "EVIDENCE",
    description: "Collecting & verifying market intelligence",
    color: theme.purple,
    delayMs: 0,
  },
  {
    key: "analysis",
    label: "ANALYSIS",
    description: "Processing company, financial & market data",
    color: theme.blue,
    delayMs: 700,
  },
  {
    key: "conviction",
    label: "CONVICTION",
    description: "Generating investment conviction signal",
    color: theme.teal,
    delayMs: 1400,
  },
];

function BootStageRow({ stage, active, complete }: { stage: StageDef; active: boolean; complete: boolean }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            border: `2px solid ${stage.color}`,
            marginRight: 8,
            backgroundColor: complete ? stage.color : "transparent",
            transition: "background-color 300ms ease",
          }}
        />
        <span style={{ color: theme.text, fontSize: 13, fontWeight: 900, letterSpacing: 1 }}>
          {stage.label}
        </span>
      </div>
      <p style={{ color: theme.muted, fontSize: 11, margin: "0 0 8px 22px" }}>
        {stage.description}
      </p>
      <div
        style={{
          width: "calc(100% - 22px)",
          marginLeft: 22,
          height: 3,
          borderRadius: 2,
          backgroundColor: theme.border,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 3,
            borderRadius: 2,
            backgroundColor: stage.color,
            width: active || complete ? "100%" : "0%",
            transition: `width 900ms cubic-bezier(0.33, 1, 0.68, 1) ${stage.delayMs}ms`,
          }}
        />
      </div>
    </div>
  );
}

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<"initializing" | "booting" | "ready">("initializing");
  const [fillsStarted, setFillsStarted] = useState(false);

  useEffect(() => {
    const bootTimer = setTimeout(() => setStage("booting"), 1000);
    const fillTimer = setTimeout(() => setFillsStarted(true), 1050);
    const readyTimer = setTimeout(() => setStage("ready"), 3350);
    const completeTimer = setTimeout(() => onComplete(), 5000);

    return () => {
      clearTimeout(bootTimer);
      clearTimeout(fillTimer);
      clearTimeout(readyTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: theme.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div
          style={{
            backgroundColor: "#000",
            borderRadius: 12,
            padding: 32,
            marginBottom: 40,
            textAlign: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, boot screen only */}
          <img src="/ipo-sniper-logo.png" alt="IPO Sniper AI" style={{ width: "100%", maxWidth: 220, margin: "0 auto" }} />
        </div>

        {stage === "initializing" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: theme.purple, fontSize: 14, fontWeight: 900, letterSpacing: 2, marginBottom: 6 }}>
              INITIALIZING
            </p>
            <p style={{ color: theme.muted, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
              INTELLIGENCE ENGINE INITIALIZING
            </p>
          </div>
        )}

        {stage === "booting" && (
          <div>
            <p style={{ color: theme.muted, fontSize: 12, fontWeight: 900, letterSpacing: 2, textAlign: "center", marginBottom: 20 }}>
              BOOTING
            </p>
            {STAGES.map(s => (
              <BootStageRow key={s.key} stage={s} active={fillsStarted} complete={false} />
            ))}
          </div>
        )}

        {stage === "ready" && (
          <div>
            <p style={{ color: theme.muted, fontSize: 12, fontWeight: 900, letterSpacing: 2, textAlign: "center", marginBottom: 20 }}>
              READY
            </p>
            {STAGES.map(s => (
              <BootStageRow key={s.key} stage={s} active={true} complete={true} />
            ))}
            <p style={{ color: theme.teal, fontSize: 13, fontWeight: 900, letterSpacing: 1, textAlign: "center", marginTop: 16 }}>
              INTELLIGENCE ENGINE ONLINE
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
