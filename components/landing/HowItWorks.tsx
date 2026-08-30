const STEPS = [
    {
        number: "01",
        title: "Sign In",
        description: "Create a free account. Takes under a minute — no credit card.",
    },
    {
        number: "02",
        title: "Open the Workstation",
        description: "Enter any public company's ticker and click Analyze.",
    },
    {
        number: "03",
        title: "Watch the Committee Work",
        description: "15 specialized AI analysts examine SEC filings, financials, and market data in real time. You'll see exactly which ones found enough verified evidence to form an opinion — and which honestly didn't.",
    },
    {
        number: "04",
        title: "Get a Traceable Conviction Score",
        description: "Every number traces back to a real source you can inspect. Not a black box — a paper trail.",
    },
];

/**
 * Real, honest description of what actually happens when someone
 * signs up — not aspirational feature copy. Matches the true
 * pipeline (Evidence -> Committee -> Report) and the actual honest-
 * uncertainty behavior (some analysts correctly report "no verified
 * data" rather than a fake confident answer), since overselling this
 * on the landing page and underdelivering in the product would be
 * exactly the kind of gap this whole build has been eliminating.
 */
export default function HowItWorks() {
    return (
        <section className="border-t border-zinc-900 bg-black px-6 py-24 text-white">
            <div className="mx-auto max-w-5xl">

                <p className="mb-3 text-center text-sm uppercase tracking-[0.35em] text-blue-400">
                    Evidence · Analysis · Conviction
                </p>
                <p className="mt-3 text-center text-sm text-zinc-300">
                    Paul Jardim’s Rule: Facts, Not Sentiment. It’s the discipline behind Evidence, Analysis, Conviction.
                </p>

                <h2 className="mb-16 text-center text-3xl font-bold sm:text-4xl">
                    From raw data to an investment decision, in one research run
                </h2>

                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {STEPS.map(step => (
                        <div key={step.number}>
                            <p className="mb-3 text-3xl font-bold text-blue-500/40">{step.number}</p>
                            <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                            <p className="text-sm text-zinc-400">{step.description}</p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
