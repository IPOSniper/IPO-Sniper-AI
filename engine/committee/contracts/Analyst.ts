// engine/committee/contracts/Analyst.ts

import { AnalystReport } from "./AnalystReport";

/**
 * Base interface implemented by every analyst in the system.
 *
 * Each analyst is responsible for evaluating one aspect of an
 * investment opportunity and returning a standardized report.
 *
 * Examples:
 *  - FinancialAnalyst
 *  - TechnicalAnalyst
 *  - IPOAnalyst
 *  - MacroAnalyst
 *  - RiskManager
 */
export interface Analyst<TInput> {
  /**
   * Display name shown in reports and committee output.
   */
  readonly name: string;

  /**
   * Version of the analyst logic.
   * Useful for debugging, audits, and backtesting.
   */
  readonly version: string;

  /**
   * Performs the analyst's evaluation.
   *
   * @param input Data required for analysis
   * @returns Standardized analyst report
   */
  analyze(input: TInput): Promise<AnalystReport>;
}