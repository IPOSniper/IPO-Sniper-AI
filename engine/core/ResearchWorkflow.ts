import { Workflow } from "./Workflow";

export class ResearchWorkflow {

    public static build(): Workflow {

        return {

            steps: [

                {

                    engineId: "research"

                }

            ]

        };

    }

}
