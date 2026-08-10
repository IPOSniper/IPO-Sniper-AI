import { IDataProvider } from "./IDataProvider";

export class ProviderRegistry {

    private readonly providers =
        new Map<string, IDataProvider>();

    register(
        provider: IDataProvider
    ) {

        this.providers.set(
            provider.name,
            provider
        );

    }

    get(
        name: string
    ) {

        return this.providers.get(name);

    }

    getAll() {

        return [...this.providers.values()];

    }

}
