import type { ReactNode } from "react";

interface AppShellProps {
    left: ReactNode;
    center: ReactNode;
    right: ReactNode;
}

export default function AppShell({
    left,
    center,
    right,
}: AppShellProps) {
    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <div className="grid grid-cols-[300px_1fr_360px] gap-6 p-6">

                <aside className="space-y-6">
                    {left}
                </aside>

                <main className="space-y-6">
                    {center}
                </main>

                <aside className="space-y-6">
                    {right}
                </aside>

            </div>
        </div>
    );
}
