import type { Analyst } from "../../committee/contracts/Analyst";
import type { AnalystReport } from "../../committee/contracts/AnalystReport";

export class AnalystHub<TInput> {

    private readonly analysts: Analyst<TInput>[] = [];

    register(
        analyst: Analyst<TInput>
    ): void {

        this.analysts.push(analyst);

    }

    registerMany(
        analysts: Analyst<TInput>[]
    ): void {

        this.analysts.push(...analysts);

    }

    async analyze(
        input: TInput
    ): Promise<AnalystReport[]> {

        return Promise.all(
            this.analysts.map(
                analyst => analyst.analyze(input)
            )
        );

    }

    get count(): number {

        return this.analysts.length;

    }

}
