import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="flex-1 p-6"> {/* SCROLL_CONTAINER_FIX_V1: removed overflow-auto -- this div was the real scroll container for the whole app, breaking position:sticky computations deeper in the tree; the real page body now scrolls instead */}
          {children}
        </main>
      </div>
    </div>
  );
}