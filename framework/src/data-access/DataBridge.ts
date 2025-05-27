import { CompiledSchema, EntityChanges, EntityModificationResult, IDbPlugin, InferCreateType, InferType, Query, uuidv4 } from "@agrejus/db-framework-core";
import { DbSetOptions } from "../types";
import { StatefulDataAccessStrategy } from "./strategies/StatefulDataAccessStrategy";
import { DatabaseDataAccessStrategy } from "./strategies/DatabaseDataAccessStrategy";
import { IDataAccessStrategy } from "./types";
import { UniDirectionalSubscription } from "../subscriptions/UniDirectionalSubscription";
import { MemoryPlugin } from "@agrejus/db-framework-plugin-memory";

export class DataBridge<T extends {}> {

    private readonly signal: AbortSignal;
    private readonly strategy: IDataAccessStrategy<T>;
    readonly schema: CompiledSchema<T>;
    private readonly options: DbSetOptions;

    private constructor(strategy: IDataAccessStrategy<T>, schema: CompiledSchema<T>, options: DbSetOptions) {
        this.strategy = strategy;
        this.schema = schema;
        this.signal = options.signal;
        this.options = options;
    }

    private static createStrategy<T extends {}>(schema: CompiledSchema<T>, dbPlugin: IDbPlugin, options: DbSetOptions) {
        if (options.stateful === true) {
            return new StatefulDataAccessStrategy(schema, dbPlugin);
        }

        return new DatabaseDataAccessStrategy(schema, dbPlugin);
    }

    static create<T extends {}>(schema: CompiledSchema<T>, dbPlugin: IDbPlugin, options: DbSetOptions) {
        const strategy = DataBridge.createStrategy(schema, dbPlugin, options);

        return new DataBridge<T>(strategy, schema, options);
    }

    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        this.strategy.bulkOperations(this.options, schema, operations, done);
    }

    fetch<TShape>(query: Query<T, TShape>, done: (response: TShape, error?: any) => void) {
        this.strategy.fetch(this.options, query, done);
    }

    subscribe<TShape, U>(query: Query<T, TShape>, done: (result: TShape, error?: any) => void) {
        const subscription = new UniDirectionalSubscription<T>(this.schema.key, this.signal);
        subscription.onMessage((changes) => {

            // Make sure something in the subscribed query changed, 
            // if it has, we need to requery so we can send all changes
            if (changes.length > 0) {

                // create a new plugin where we can quickly persist the changes and then query them
                const ephemeralPlugin = new MemoryPlugin(uuidv4());

                // seed the db, we don't care about bulk operations here, we just want to query the data
                ephemeralPlugin.seed(this.schema, changes);

                // query the temp db to check and see if items match the query
                ephemeralPlugin.query(query, (r, e) => {

                    ephemeralPlugin.destroy(() => { });

                    if (e != null) {
                        done(null, e);
                        return;
                    }

                    if (r == null || (Array.isArray(r) && r.length === 0)) {
                        return;
                    }

                    // If the query returns results, we need to query the db to find all records
                    this.fetch(query, done);
                });
            }
        });

        return () => subscription[Symbol.dispose]();
    }
}