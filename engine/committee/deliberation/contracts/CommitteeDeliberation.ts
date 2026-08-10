import type { CommitteeFinding } from "./CommitteeFinding";
import type { CommitteeConflict } from "./CommitteeConflict";
import type { CommitteeConsensus } from "./CommitteeConsensus";

export interface CommitteeDeliberation {

    findings: CommitteeFinding[];

    conflicts: CommitteeConflict[];

    consensus: CommitteeConsensus;

    unansweredQuestions: string[];

}
