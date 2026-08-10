import { BrainThesis } from "./BrainThesis";
import { ReasoningReport } from "../../reasoning/contracts/ReasoningReport";

export class BrainThesisEngine {

    build(report: ReasoningReport): BrainThesis {

        return {

            thesis: "",

            rationale: [],

            supportingEvidence: [],

            opposingEvidence: [],

            assumptions: [],

            invalidationTriggers: []

        };

    }

}
