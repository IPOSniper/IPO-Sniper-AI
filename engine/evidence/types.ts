import type { EvidenceSource } from "../committee/contracts/types";

/**
 * A single piece of evidence used by analysts.
 * Every value knows where it came from and how trustworthy it is.
 */
export interface EvidenceItem<T> {

  value: T;

  source: EvidenceSource;

  confidence: number;

  verified: boolean;

  collectedAt: Date;

}

export interface EvidenceBuilder<T> {

  build(input: unknown): Promise<T>;

}
