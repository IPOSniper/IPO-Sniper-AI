"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Web equivalent of the mobile app's BootSequence. 2.4s is a CAP,
 * not a forced hold -- if the app is genuinely ready sooner (fonts
 * loaded, boot logo loaded), we finish early. Never artificially
 * delays the user past real readiness; never claims readiness before
 * it's real either. A ~550ms floor exists purely to avoid an
 * imperceptible flicker on very fast connections, not to fake work.
 *
 * Real signals raced against the 2400ms cap:
 * 1. document.fonts.ready -- genuine browser API, resolves when web
 *    fonts have actually finished loading.
 * 2. The boot logo's own onLoad event -- confirms that specific
 *    image genuinely finished loading, not just requested.
 * Whichever combination of (real readiness, floor) finishes LAST
 * determines when the stage visually reaches "ready" -- but never
 * later than the 2400ms cap, and the cap always wins if real
 * readiness signals hang or never resolve (e.g. an unsupported
 * browser missing document.fonts).
 *
 * This is still a decorative brand moment, not a live system check
 * of Evidence/Analysis/Conviction -- "INTELLIGENCE ENGINE ONLINE"
 * does not mean any real provider or evidence system was verified.
 * Never describe it as one. What IS real here is the timing itself:
 * the moment this dismisses is tied to genuine readiness, not a
 * fabricated number.
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

const CAP_MS = 2400;
const FLOOR_MS = 550;

interface StageDef {
  key: "evidence" | "analysis" | "conviction";
  label: string;
  description: string;
  color: string;
}

const STAGES: StageDef[] = [
  {
    key: "evidence",
    label: "EVIDENCE",
    description: "Collecting & verifying market intelligence",
    color: theme.purple,
  },
  {
    key: "analysis",
    label: "ANALYSIS",
    description: "Processing company, financial & market data",
    color: theme.blue,
  },
  {
    key: "conviction",
    label: "CONVICTION",
    description: "Generating investment conviction signal",
    color: theme.teal,
  },
];

function BootStageRow({ stage, complete }: { stage: StageDef; complete: boolean }) {
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
            transition: "background-color 200ms ease",
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
            width: complete ? "100%" : "0%",
            transition: "width 260ms ease",
          }}
        />
      </div>
    </div>
  );
}

function BootLogo({ onLoadOrError }: { onLoadOrError: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <div style={{ backgroundColor: "#000", borderRadius: 12, padding: 32, marginBottom: 40, textAlign: "center" }}>
        <span style={{ color: theme.text, fontSize: 24, fontWeight: 900, letterSpacing: 1 }}>
          IPO SNIPER <span style={{ color: theme.purple }}>AI</span>
        </span>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#000", borderRadius: 12, padding: 32, marginBottom: 40, textAlign: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, boot screen only, needs onLoad/onError */}
      <img
        src="/ipo-sniper-logo.png"
        alt="IPO Sniper AI"
        style={{ width: "100%", maxWidth: 220, margin: "0 auto", display: "block" }}
        onLoad={onLoadOrError}
        onError={() => {
          setImgFailed(true);
          onLoadOrError();
        }}
      />
    </div>
  );
}

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<"initializing" | "booting" | "ready">("initializing");
  const startRef = useRef<number>(Date.now());
  const fontsReadyRef = useRef(false);
  const logoReadyRef = useRef(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    setStage("booting");

    function tryDismiss() {
      if (dismissedRef.current) return;
      const realReady = fontsReadyRef.current && logoReadyRef.current;
      const elapsed = Date.now() - startRef.current;
      if (realReady && elapsed >= FLOOR_MS) {
        dismissedRef.current = true;
        setStage("ready");
        setTimeout(onComplete, 180);
      }
    }

    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready
        .then(() => {
          fontsReadyRef.current = true;
          tryDismiss();
        })
        .catch(() => {
          fontsReadyRef.current = true;
          tryDismiss();
        });
    } else {
      fontsReadyRef.current = true;
    }

    const floorTimer = setTimeout(tryDismiss, FLOOR_MS);

    const capTimer = setTimeout(() => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      setStage("ready");
      setTimeout(onComplete, 180);
    }, CAP_MS);

    return () => {
      clearTimeout(floorTimer);
      clearTimeout(capTimer);
    };
  }, [onComplete]);

  function handleLogoReady() {
    logoReadyRef.current = true;
  }

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
        <BootLogo onLoadOrError={handleLogoReady} />

        {stage === "initializing" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: theme.purple, fontSize: 14, fontWeight: 900, letterSpacing: 2, marginBottom: 6 }}>
              INITIALIZING
            </p>
          </div>
        )}

        {stage === "booting" && (
          <div>
            <p style={{ color: theme.muted, fontSize: 12, fontWeight: 900, letterSpacing: 2, textAlign: "center", marginBottom: 20 }}>
              BOOTING
            </p>
            {STAGES.map(s => (
              <BootStageRow key={s.key} stage={s} complete={false} />
            ))}
          </div>
        )}

        {stage === "ready" && (
          <div>
            <p style={{ color: theme.muted, fontSize: 12, fontWeight: 900, letterSpacing: 2, textAlign: "center", marginBottom: 20 }}>
              READY
            </p>
            {STAGES.map(s => (
              <BootStageRow key={s.key} stage={s} complete={true} />
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
