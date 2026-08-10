import type { CompanySection, MarketSection } from "@/types/ResearchWorkstation";

interface CompanyHeaderProps {
    company: CompanySection;
    market: MarketSection;
}

export default function CompanyHeader({
    company,
    market,
}: CompanyHeaderProps) {
    return (
        <header className="border-b border-slate-800 bg-slate-900 px-6 py-4">
            <div className="flex items-center justify-between">

                <div>
                    <h1 className="text-3xl font-bold">
                        {company.name}
                    </h1>

                    <p className="text-slate-400">
                        {company.ticker} | {company.exchange} | {company.industry}
                    </p>
                </div>

                <div className="text-right">
                    <div className="text-3xl font-bold">
                        ${market.price.toFixed(2)}
                    </div>

                    <div className={market.percentChange >= 0 ? "text-green-400" : "text-red-400"}>
                        {market.percentChange >= 0 ? "+" : ""}
                        {market.percentChange.toFixed(2)}%
                    </div>
                </div>

            </div>
        </header>
    );
}
