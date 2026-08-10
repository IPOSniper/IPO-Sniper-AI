export interface BootStep {
  id: number;
  text: string;
  delay: number;
}

export const bootSequence: BootStep[] = [
  {
    id: 1,
    text: "Initializing IPO Sniper AI...",
    delay: 1000,
  },
  {
    id: 2,
    text: "Connecting to SEC EDGAR...",
    delay: 2200,
  },
  {
    id: 3,
    text: "Connecting to Market Data...",
    delay: 3400,
  },
  {
    id: 4,
    text: "Loading Financial Statements...",
    delay: 4600,
  },
  {
    id: 5,
    text: "Building Knowledge Graph...",
    delay: 5800,
  },
  {
    id: 6,
    text: "Starting AI Investment Committee...",
    delay: 7000,
  },
  {
    id: 7,
    text: "Launching Research Dashboard...",
    delay: 8500,
  }
];
