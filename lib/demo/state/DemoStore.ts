export interface ActivityItem {
  id: number;
  time: string;
  message: string;
}

export interface EvidenceItem {
  id: number;
  title: string;
  value: string;
}

export interface CommitteeVote {
  analyst: string;
  recommendation: string;
  confidence: number;
  reason: string;
}

export interface DemoState {
  progress: number;
  activity: ActivityItem[];
  evidence: EvidenceItem[];
  committee: CommitteeVote[];
  conviction: number;
  thesis: string;
  completed: boolean;
}

export const initialDemoState: DemoState = {
  progress: 0,
  activity: [],
  evidence: [],
  committee: [],
  conviction: 0,
  thesis: "",
  completed: false,
};
