export default function TermsPage() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-16 text-white">
            <h1 className="text-2xl font-bold">Terms of Service</h1>
            <p className="mt-6 rounded-lg border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-200">
                These terms are being finalized with legal counsel and are not yet complete.
                This page is an honest placeholder, not a binding agreement — do not rely on it
                as your actual Terms of Service.
            </p>
            <p className="mt-6 text-sm text-zinc-400">
                In the meantime, see the <a href="/#disclosures" className="underline">Disclosures</a> section
                on the homepage for the current, real statements about what this platform is and isn&apos;t.
            </p>
        </main>
    );
}
