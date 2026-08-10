export type Recommendation =
  | "Strong Buy"
  | "Buy"
  | "Hold"
  | "Avoid";

export interface Evidence {
  id: string;
  title: string;
  description: string;
  source: string;
  strength: number; // 0-100
}

export interface MonitoringItem {
  title: string;
  reason: string;
}