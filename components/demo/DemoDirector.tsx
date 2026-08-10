"use client";

import { useEffect, useState } from "react";
import BootScreen from "./BootScreen";
import DashboardShell from "./shell/DashboardShell";

export default function DemoDirector() {

  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {

    const timer = setTimeout(() => {

      setBootComplete(true);

    }, 9000);

    return () => clearTimeout(timer);

  }, []);

  if (!bootComplete) {

    return <BootScreen />;

  }

  return <DashboardShell />;

}
