import type { EvidenceReference } from "../models/EvidenceReference";

export class EvidenceRegistry {

    private readonly evidence =
        new Map<string, EvidenceReference>();

    add(
        reference: EvidenceReference
    ): void {

        this.evidence.set(
            reference.id,
            reference
        );

    }

    addMany(
        references: EvidenceReference[]
    ): void {

        for (const reference of references) {

            this.add(reference);

        }

    }

    get(
        id: string
    ): EvidenceReference | undefined {

        return this.evidence.get(id);

    }

    getAll(): EvidenceReference[] {

        return Array.from(
            this.evidence.values()
        );

    }

    findByTicker(
        ticker: string
    ): EvidenceReference[] {

        return this.getAll().filter(

            reference =>
                reference.ticker === ticker

        );

    }

    clear(): void {

        this.evidence.clear();

    }

}
