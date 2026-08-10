export interface CommitteeRule<TContext = any> {
    name: string;

    evaluate(context: TContext): Promise<void> | void;
}