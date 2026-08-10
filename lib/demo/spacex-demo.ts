import { DemoEvent } from "./events";

export const spacexDemo: DemoEvent[] = [
  {
    id: 1,
    delay: 1000,
    type: "progress",
    title: "Initializing IPO Sniper AI..."
  },
  {
    id: 2,
    delay: 2500,
    type: "progress",
    title: "Connecting to SEC EDGAR..."
  },
  {
    id: 3,
    delay: 4000,
    type: "progress",
    title: "Downloading financial statements..."
  },
  {
    id: 4,
    delay: 5500,
    type: "evidence",
    title: "Revenue identified",
    description: "$13.4B TTM"
  },
  {
    id: 5,
    delay: 7000,
    type: "evidence",
    title: "Institutional ownership",
    description: "87%"
  },
  {
    id: 6,
    delay: 8500,
    type: "analyst",
    title: "Fundamental Analyst",
    description: "Revenue growth exceeds industry median."
  },
  {
    id: 7,
    delay: 10000,
    type: "analyst",
    title: "Risk Analyst",
    description: "Valuation remains elevated."
  },
  {
    id: 8,
    delay: 11500,
    type: "vote",
    title: "Committee Vote",
    description: "BUY (4 of 5)"
  },
  {
    id: 9,
    delay: 13000,
    type: "thesis",
    title: "Investment Thesis Generated"
  },
  {
    id: 10,
    delay: 14500,
    type: "complete",
    title: "Research Complete"
  }
];
