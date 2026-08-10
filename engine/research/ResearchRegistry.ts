import { FinancialResearchDomains } from "./domains/FinancialResearchDomains";
import { GrowthInvestigations } from "./domains/GrowthInvestigations";

export class ResearchRegistry {

    static getDomains() {
        return FinancialResearchDomains;
    }

    static getGrowthInvestigations() {
        return GrowthInvestigations;
    }

    static getAllInvestigations() {
        return [
            ...GrowthInvestigations
        ];
    }

}
