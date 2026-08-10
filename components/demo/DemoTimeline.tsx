"use client";

import { useEffect } from "react";
import { useDemo } from "./DemoContext";
import { spacexDemo } from "@/lib/demo/spacex-demo";

export default function DemoTimeline() {
  const { setDemo } = useDemo();

  useEffect(() => {

    let progress = 0;

    const timers = spacexDemo.map((event) =>
      setTimeout(() => {

        switch (event.type) {

          case "progress":

            progress += 20;

            setDemo((prev) => ({
              ...prev,
              progress,
              activity: [
                ...prev.activity,
                {
                  id: event.id,
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  message: event.title,
                },
              ],
            }));

            break;

          case "evidence":

            setDemo((prev) => ({
              ...prev,
              evidence: [
                ...prev.evidence,
                {
                  id: event.id,
                  title: event.title,
                  value: event.description ?? "",
                },
              ],
            }));

            break;

          case "analyst":

            setDemo((prev) => ({
              ...prev,
              committee: [
                ...prev.committee,
                {
                  analyst: event.title,
                  recommendation: "BUY",
                  confidence: 90,
                  reason: event.description ?? "",
                },
              ],
            }));

            break;

          case "vote":

            setDemo((prev) => ({
              ...prev,
              conviction: 91,
            }));

            break;

          case "thesis":

            setDemo((prev) => ({
              ...prev,
              thesis:
                "SpaceX demonstrates exceptional growth, strong cash generation, and increasing institutional demand.",
            }));

            break;

          case "complete":

            setDemo((prev) => ({
              ...prev,
              progress: 100,
              completed: true,
            }));

            break;

        }

      }, event.delay)
    );

    return () => timers.forEach(clearTimeout);

  }, [setDemo]);

  return null;
}
