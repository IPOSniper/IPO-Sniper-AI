import { ResearchRegistry } from "./ResearchRegistry";
import { InvestigationExecutor } from "../investigation/executors/InvestigationExecutor";

export class ResearchExecutor {

    constructor(
        private readonly executor: InvestigationExecutor
    ) {}

    execute() {

        const investigations = ResearchRegistry.getAllInvestigations();

        return investigations.map(investigation => ({
            id: investigation.id,
            name: investigation.name,
            enabled: investigation.enabled
        }));

    }

}
