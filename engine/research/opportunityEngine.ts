import { Opportunity } from "../models/Opportunity";

export class OpportunityEngine {
  async getTopOpportunities(): Promise<Opportunity[]> {
    return [
      {
        id: "1",
        ticker: "FLY",
        companyName: "Firefly Aerospace",
        recommendation: "Strong Buy",
        conviction: 94,
        confidence: 96,
        reasons: [
          "Institutional buying accelerating",
          "DoD contract catalyst",
          "Revenue growth improving",
        ],
        catalyst: "Earnings Tomorrow",
        updatedAt: new Date(),
      },
      {
        id: "2",
        ticker: "CBRS",
        companyName: "Cerebras",
        recommendation: "Buy",
        conviction: 91,
        confidence: 93,
        reasons: [
          "AI infrastructure demand",
          "Strong backlog",
        ],
        catalyst: "AI Conference",
        updatedAt: new Date(),
      },
      {
        id: "3",
        ticker: "FIG",
        companyName: "Figure AI",
        recommendation: "Hold",
        conviction: 89,
        confidence: 90,
        reasons: [
          "IPO expected",
          "Strong robotics market",
        ],
        updatedAt: new Date(),
      },
    ];
  }
}