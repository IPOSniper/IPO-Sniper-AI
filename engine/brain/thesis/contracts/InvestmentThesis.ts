export interface InvestmentThesis {

    recommendation:
        "Strong Buy" |
        "Buy" |
        "Hold" |
        "Sell";

    conviction: number;

    executiveSummary: string;

    bullCase: string[];

    bearCase: string[];

    risks: string[];

    catalysts: string[];

}
