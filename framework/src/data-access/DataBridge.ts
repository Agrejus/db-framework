import { CompiledSchema, EntityChanges, EntityModificationResult, IDbPlugin, InferType, Query } from "@agrejus/db-framework-core";
import { DbSetOptions } from "../types";
import { StatefulDataAccessStrategy } from "./strategies/StatefulDataAccessStrategy";
import { DatabaseDataAccessStrategy } from "./strategies/DatabaseDataAccessStrategy";
import { IDataAccessStrategy } from "./types";
import { UniDirectionalSubscription } from "../subscriptions/UniDirectionalSubscription";

export class DataBridge<T extends {}> {

    private readonly signal: AbortSignal;
    private readonly strategy: IDataAccessStrategy<T>;
    readonly schema: CompiledSchema<T>;

    constructor(strategy: IDataAccessStrategy<T>, schema: CompiledSchema<T>, signal: AbortSignal) {
        this.strategy = strategy;
        this.schema = schema;
        this.signal = signal;
    }

    private static createStrategy<T extends {}>(schema: CompiledSchema<T>, dbPlugin: IDbPlugin, options: DbSetOptions) {
        if (options.stateful === true) {
            return new StatefulDataAccessStrategy(schema, dbPlugin);
        }

        return new DatabaseDataAccessStrategy(schema, dbPlugin);
    }

    static create<T extends {}>(schema: CompiledSchema<T>, dbPlugin: IDbPlugin, options: DbSetOptions) {
        const strategy = DataBridge.createStrategy(schema, dbPlugin, options);

        return new DataBridge<T>(strategy, schema, options.signal);
    }

    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        this.strategy.bulkOperations(schema, operations, done);
    }

    fetch(query: Query<T>, done: (response: { result: T[], shouldEnableChangeTracking: boolean }, error?: any) => void) {
        this.strategy.fetch(query, done);
    }

    filter(query: Query<T>, data: InferType<T>[]) {
        return this.strategy.filter(query, data);
    }

    subscribe<U>(query: Query<T>, shape: (data: T[]) => U, done: (result: { data: U, shouldEnableChangeTracking: boolean }, error?: any) => void) {
        const subscription = new UniDirectionalSubscription<T>(this.schema.key, this.signal);
        subscription.onMessage((changes) => {

            const data = this.filter(query, changes);
            debugger;
            // Make sure something in the subscribed query changed, 
            // if it has, we need to requery so we can send all changes
            if (data.length > 0) {
                this.fetch(query, (r, e) => {
                    const { result, shouldEnableChangeTracking } = r;
                    const shapedData = shape(result);
                    done({ data: shapedData, shouldEnableChangeTracking }, e);
                });
            }
        });

        return () => subscription[Symbol.dispose]();
    }
}