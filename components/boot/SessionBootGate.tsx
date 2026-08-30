"use client";

import { useEffect, useState } from "react";
import BootSequence from "./BootSequence";

/**
 * Isolated session gate -- the ONLY thing this touches in the rest
 * of the app is wrapping {children} in layout.tsx. Once per browser
 * session (sessionStorage, not localStorage -- deliberately resets
 * on a genuinely new session, unlike localStorage which would
 * persist forever). Navigating between pages within the same
 * session never re-triggers this.
 */
const STORAGE_KEY = "ipo-sniper-boot-complete";

export default function SessionBootGate({ children }: { children: React.ReactNode }) {
  const [showBoot, setShowBoot] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const alreadyBooted = sessionStorage.getItem(STORAGE_KEY) === "true";
      setShowBoot(!alreadyBooted);
    } catch {
      // sessionStorage unavailable (e.g. some privacy modes) -- fail
      // open, never block the real app behind a broken storage check.
      setShowBoot(false);
    }
  }, []);

  function handleComplete() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Non-fatal if this fails -- worst case the boot sequence
      // shows again next navigation, never a broken app.
    }
    setShowBoot(false);
  }

  // Avoid a flash of the real app before the sessionStorage check
  // resolves on first paint -- render nothing for that one tick
  // rather than show-then-hide the real app.
  if (showBoot === null) {
    return null;
  }

  if (showBoot) {
    return <BootSequence onComplete={handleComplete} />;
  }

  return <>{children}</>;
}
