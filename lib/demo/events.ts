export type DemoEventType =
  | "loading"
  | "progress"
  | "evidence"
  | "analyst"
  | "vote"
  | "thesis"
  | "complete";

export interface DemoEvent {
  id: number;
  delay: number;
  type: DemoEventType;
  title: string;
  description?: string;
}
