"use client";

import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import ResearchPanel from "./ResearchPanel";
import EvidencePanel from "./EvidencePanel";
import CommitteePanel from "./CommitteePanel";
import ConvictionPanel from "./ConvictionPanel";
import ActivityFeed from "./ActivityFeed";
import { DemoProvider } from "../DemoContext";
import DemoTimeline from "../DemoTimeline";

export default function DashboardShell() {
  return (
    <DemoProvider>
      <div className="min-h-screen bg-[#09090b] text-white">
        <DemoTimeline />
        <TopBar />

        <div className="grid grid-cols-[260px_1fr] h-[calc(100vh-72px)]">

          <Sidebar />

          <main className="p-6">

            <div className="grid grid-cols-2 grid-rows-3 gap-6 h-full">

              <ResearchPanel />

              <ActivityFeed />

              <EvidencePanel />

              <CommitteePanel />

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

                <h2 className="text-lg font-semibold">
                  Investment Thesis
                </h2>

                <p className="mt-4 text-zinc-500">
                  Waiting for committee consensus...
                </p>

              </div>

              <ConvictionPanel />

            </div>

          </main>

        </div>

      </div>
    </DemoProvider>
  );
}
