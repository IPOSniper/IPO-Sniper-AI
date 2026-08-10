import { BaseInvestigation } from "../base/BaseInvestigation";
import { RevenueGrowthInvestigation } from "../investigations/RevenueGrowthInvestigation";

export class InvestigationRegistry {

    private readonly investigations =
        new Map<string, BaseInvestigation>();

    constructor() {

        this.register(
            new RevenueGrowthInvestigation()
        );

    }

    public register(
        investigation: BaseInvestigation
    ): void {

        this.investigations.set(
            investigation.id,
            investigation
        );

    }

    public get(
        id: string
    ): BaseInvestigation {

        const investigation =
            this.investigations.get(id);

        if (!investigation) {

            throw new Error(
                `Unknown investigation: ${id}`
            );

        }

        return investigation;

    }

    public getAll(): BaseInvestigation[] {

        return Array.from(
            this.investigations.values()
        );

    }

}
