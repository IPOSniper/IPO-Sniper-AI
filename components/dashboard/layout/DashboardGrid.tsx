import IPOWeatherCard from "../market/IPOWeatherCard";
import CalendarCard from "../CalendarCard";
import SmartMoneyCard from "../SmartMoneyCard";
import CauseEffectCard from "../CauseEffectCard";
import MarketCard from "../MarketCard";
import BusinessFundamentalsWidget from "../widgets/BusinessFundamentalsWidget";
import type { BusinessFundamentals } from "@/engine/types/BusinessFundamentals";

const mockFundamentals: BusinessFundamentals = {
  overall: {
    score: 91,
    confidence: 0.94,
    summary:
      "Strong fundamentals driven by revenue growth, healthy margins, and solid cash generation.",
  },
  revenueGrowth: { score: 94 },
  profitability: { score: 88 },
  cashFlow: { score: 91 },
  management: { score: 90 },
};

export default function DashboardGrid() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {/* Company Intelligence */}
      <BusinessFundamentalsWidget
        companyName="NVIDIA"
        fundamentals={mockFundamentals}
      />

      {/* IPO Environment */}
      <IPOWeatherCard />

      {/* Upcoming Catalysts */}
      <CalendarCard />

      {/* Institutional Activity */}
      <SmartMoneyCard />

      {/* Market Narrative */}
      <CauseEffectCard />

      {/* Market Snapshot */}
      <MarketCard />
    </section>
  );
}
