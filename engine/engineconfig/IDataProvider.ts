export interface IDataProvider<T = any> {

    readonly name: string;

    isAvailable(): Promise<boolean>;

    fetch(
        ticker: string
    ): Promise<T>;

}
