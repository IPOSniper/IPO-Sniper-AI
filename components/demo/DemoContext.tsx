"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

import {
  DemoState,
  initialDemoState,
} from "@/lib/demo/state/DemoStore";

interface DemoContextType {
  demo: DemoState;
  setDemo: React.Dispatch<React.SetStateAction<DemoState>>;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [demo, setDemo] = useState(initialDemoState);

  return (
    <DemoContext.Provider value={{ demo, setDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);

  if (!context) {
    throw new Error("useDemo must be used inside DemoProvider");
  }

  return context;
}
