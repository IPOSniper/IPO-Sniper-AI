import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import EarningsRecapPanel from "./EarningsRecapPanel";
import EarningsPreviewPanel from "./EarningsPreviewPanel";
import EarningsPreviewShareCardButton from "./EarningsPreviewShareCard/EarningsPreviewShareCardButton";

/**
 * The full before/after pair: EarningsRecapPanel shows the most
 * recently reported quarter (real Finnhub actuals + fixed
 * EPSAnalyzer/RevenueAnalyzer + grounded AI recap), EarningsPreviewPanel
 * shows the next confirmed report date (real Finnhub calendar +
 * grounded AI preview). Either can independently render nothing/an
 * honest-empty state — a pre-revenue company might have a next date
 * but no reported history yet, and vice versa.
 */
export default function EarningsPanel({ research }: WorkstationPanelProps) {
    const { company } = research.report.evidence;

    return (
        <div className="space-y-4">
            <EarningsRecapPanel ticker={company.ticker} companyName={company.name} />
            <EarningsPreviewPanel
                ticker={company.ticker}
                companyName={company.name}
                sector={company.sector}
                industry={company.industry}
            />
            <EarningsPreviewShareCardButton
                ticker={company.ticker}
                companyName={company.name}
                sector={company.sector}
                industry={company.industry}
            />
        </div>
    );
}
