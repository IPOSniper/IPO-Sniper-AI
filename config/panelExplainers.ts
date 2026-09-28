import type { ExplainerContent } from "@/components/shared/DataContext";

/**
 * Central home for plain-English panel explainers. Static text on purpose:
 * it needs no AI credits, reads the same every load, and can be reviewed
 * in one place. Rules for every entry: define the metric, describe general
 * drivers with hedged wording (tends to, often), never predict, never advise.
 * Anything that would require a company-specific cause belongs in real data,
 * not here.
 */
export const PANEL_EXPLAINERS: Record<string, ExplainerContent> = {
    DIA: {
        meaning: "Tracks the Dow Jones Industrial Average: 30 large, long-established US companies. It is price-weighted, so a stock with a higher share price moves it more than a lower-priced stock, regardless of company size.",
        whyItMatters: "It is a common shorthand for how big, established US brands are doing. Companies like these make up a large share of many retirement funds.",
        influences: [
            "Company earnings reports, especially around earnings season",
            "Interest-rate expectations and central bank signals",
            "Jobs, inflation, and consumer-spending data",
            "A handful of high-priced stocks moving the price-weighted average",
            "Trade policy, tariffs, and energy prices",
            "Geopolitical events that shake overall confidence",
        ],
    },
    SPY: {
        meaning: "Tracks the S&P 500: roughly 500 large US companies, weighted by company size.",
        whyItMatters: "It is the most widely used quick read on US large-company stocks, and it sits underneath most index funds and many workplace retirement accounts.",
        influences: [
            "Corporate earnings and profit outlooks",
            "Interest rates and central bank policy",
            "Inflation and employment reports",
            "The dollar: a stronger dollar can trim overseas earnings of multinational companies",
            "A few very large technology companies carry heavy weight, so their news can move the whole index",
            "Global events and market-wide confidence",
        ],
    },
    QQQ: {
        meaning: "Tracks the Nasdaq-100: 100 of the largest non-financial companies listed on the Nasdaq, heavily weighted toward technology and growth companies.",
        whyItMatters: "It is a read on investor appetite for growth companies. Those companies' value depends more on earnings expected further in the future, so this index tends to be sensitive to interest rates.",
        influences: [
            "Long-term interest rates and Treasury yields",
            "Technology spending cycles, including AI and cloud investment",
            "Earnings from a small number of mega-cap companies",
            "Regulation and antitrust actions",
            "Chip supply chains and export rules",
        ],
    },
    IWM: {
        meaning: "Tracks the Russell 2000: about 2,000 smaller US companies.",
        whyItMatters: "Smaller companies are usually more tied to the domestic economy and more dependent on borrowing, so this is often used as a read on domestic economic confidence.",
        influences: [
            "Interest rates and how easy it is to borrow",
            "Bank lending conditions",
            "Domestic consumer and business demand",
            "Recession worries",
            "Smaller companies often borrow at variable rates, so rate changes can hit them faster",
        ],
    },
    GLD: {
        meaning: "Shares backed by physical gold, so it tracks the price of gold.",
        whyItMatters: "Gold often attracts money when people are worried about inflation or uncertainty, because it is not tied to any single company or government.",
        influences: [
            "Real interest rates: gold pays no interest, so it tends to look more attractive when rates fall",
            "The US dollar: gold is priced in dollars, and a weaker dollar tends to lift it",
            "Inflation expectations",
            "Central bank buying and selling",
            "Geopolitical stress",
            "Jewelry and industrial demand, and money flowing in and out of gold funds",
        ],
    },
    TLT: {
        meaning: "Tracks long-term US Treasury bonds (maturities of 20 years or more). Bond prices and yields move in opposite directions: when the price falls, long-term yields are rising.",
        whyItMatters: "Long-term yields tend to influence what people and businesses pay to borrow, including mortgage, car-loan, and business-loan rates. This is a loose link, not a fixed one.",
        influences: [
            "Inflation expectations",
            "Expectations for central bank rate decisions",
            "Government borrowing and deficits",
            "Economic growth and jobs data",
            "Demand for safe assets during stress, from both US and foreign buyers",
        ],
    },
    newsSentiment: {
        meaning: "The share of recent headlines (last 30 days) whose wording matched positive, negative, or neutral keywords. It is a keyword count, not a reading of each article.",
        whyItMatters: "Headlines are one signal of what is being reported about a company. They can shift attention, but they are not a measure of how the business is doing.",
        influences: [
            "Article count: with only a few articles, one or two headlines can swing the whole percentage",
            "Press releases and syndicated copies can be counted as separate articles",
            "Earnings and product announcements create bursts of coverage",
            "Words like 'cut' or 'beat' can be positive or negative depending on context, which a keyword count cannot tell apart",
            "Well-known companies get far more coverage than small ones, so a low count often reflects low coverage, not low interest",
            "Market-wide news days can pull sentiment for many companies in the same direction",
        ],
        caveat: "A result based on a handful of articles should be treated as anecdotal.",
    },
    riskIntelligence: {
        meaning: "Each line is a risk flag raised by one analyst using its own rule-based check on verified data, such as margins below a threshold or leverage above a threshold.",
        whyItMatters: "It shows which parts of the business the committee flagged, instead of hiding them inside one blended score.",
        influences: [
            "Each analyst defines its own threshold, so two analysts can flag the same underlying issue with different calculations - similar lines are not independent confirmations",
            "The time period used (latest fiscal year versus trailing figures)",
            "One-time items that distort a single period",
            "Industry norms: a capital-heavy manufacturer normally carries more debt than a software company",
            "Accounting differences between companies and filings",
        ],
        caveat: "The reasons behind a flag, such as why revenue is slowing, come from the company's filings and management commentary. This panel does not summarize those.",
    },
};