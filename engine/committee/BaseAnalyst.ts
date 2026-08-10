import type { Analyst } from "./contracts/Analyst";
import type { AnalystReport } from "./contracts/AnalystReport";

export abstract class BaseAnalyst<TInput>
  implements Analyst<TInput> {

  abstract readonly name: string;
  abstract readonly version: string;

  abstract analyze(
    input: TInput
  ): Promise<AnalystReport>;

  protected clamp(
    value: number,
    min = 0,
    max = 100
  ): number {
    return Math.max(min, Math.min(max, value));
  }

  protected average(
    values: number[]
  ): number {

    if (values.length === 0) return 0;

    return (
      values.reduce((a, b) => a + b, 0) /
      values.length
    );
  }

  protected confidence(
    evidenceStrength: number,
    dataQuality: number
  ): number {

    return this.clamp(
      Math.round(
        (evidenceStrength * 0.7) +
        (dataQuality * 0.3)
      )
    );
  }
}
