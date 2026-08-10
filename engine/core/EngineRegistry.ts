import { AIEngine } from "./AIEngine";

export class EngineRegistry {

    private readonly engines =
        new Map<string, AIEngine>();

    register(
        engine: AIEngine
    ): void {

        if (this.engines.has(engine.id)) {

            throw new Error(
                `Engine '${engine.id}' is already registered.`
            );

        }

        this.engines.set(
            engine.id,
            engine
        );

    }

    get(
        id: string
    ): AIEngine {

        const engine =
            this.engines.get(id);

        if (!engine) {

            throw new Error(
                `Unknown engine '${id}'.`
            );

        }

        return engine;

    }

    has(
        id: string
    ): boolean {

        return this.engines.has(id);

    }

    list(): AIEngine[] {

        return [...this.engines.values()];

    }

    count(): number {

        return this.engines.size;

    }

}
