import { ResearchInvestigation } from "../models/ResearchInvestigation";

export const GrowthInvestigations: ResearchInvestigation[] = [

    {
        id: "revenue_sustainability",
        domainId: "growth",
        name: "Revenue Sustainability",
        hypothesis: "Revenue growth is durable over multiple reporting periods.",
        description: "Evaluates whether revenue growth is accelerating, stable, or deteriorating.",
        enabled: true
    },

    {
        id: "customer_growth",
        domainId: "growth",
        name: "Customer Growth",
        hypothesis: "Customer acquisition supports future revenue expansion.",
        description: "Measures customer growth trends and quality.",
        enabled: true
    },

    {
        id: "pricing_power",
        domainId: "growth",
        name: "Pricing Power",
        hypothesis: "The company can increase prices without materially reducing demand.",
        description: "Evaluates pricing strength and revenue quality.",
        enabled: true
    },

    {
        id: "market_expansion",
        domainId: "growth",
        name: "Market Expansion",
        hypothesis: "The company has opportunities to expand into new markets.",
        description: "Evaluates geographic, product, and customer expansion opportunities.",
        enabled: true
    }

];
