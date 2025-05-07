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

    fetch<TShape>(query: Query<T, TShape>, done: (response: TShape, error?: any) => void) {
        this.strategy.fetch(query, done);
    }

    subscribe<TShape, U>(query: Query<T, TShape>, done: (result: TShape, error?: any) => void) {
        const subscription = new UniDirectionalSubscription<T>(this.schema.key, this.signal);
        subscription.onMessage((changes) => {

            // Make sure something in the subscribed query changed, 
            // if it has, we need to requery so we can send all changes
            if (changes.length > 0) {
                this.fetch<TShape>(query, done);
            }
        });

        return () => subscription[Symbol.dispose]();
    }
}