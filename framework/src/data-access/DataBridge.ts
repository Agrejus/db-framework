import { EntityModificationResult, IDbPlugin, Query, uuidv4 } from "@agrejus/db-framework-core";
import { DbSetOptions } from "../types";
import { StatefulDataAccessStrategy } from "./strategies/StatefulDataAccessStrategy";
import { DatabaseDataAccessStrategy } from "./strategies/DatabaseDataAccessStrategy";
import { IDataAccessStrategy } from "./types";
import { UniDirectionalSubscription } from "../subscriptions/UniDirectionalSubscription";
import { MemoryPlugin } from "@agrejus/db-framework-plugin-memory";
import { DbPluginBulkOperationsEvent, DbPluginQueryEvent } from "@agrejus/db-framework-core/dist/plugins/types";

export class DataBridge<T extends {}> {

    private readonly signal: AbortSignal;
    private readonly strategy: IDataAccessStrategy<T>;
    private readonly options: DbSetOptions;

    private constructor(strategy: IDataAccessStrategy<T>, options: DbSetOptions) {
        this.strategy = strategy;
        this.signal = options.signal;
        this.options = options;
    }

    private static createStrategy<T extends {}>(dbPlugin: IDbPlugin, options: DbSetOptions) {
        if (options.stateful === true) {
            return new StatefulDataAccessStrategy<T>(dbPlugin);
        }

        return new DatabaseDataAccessStrategy<T>(dbPlugin);
    }

    static create<T extends {}>(dbPlugin: IDbPlugin, options: DbSetOptions) {
        const strategy = DataBridge.createStrategy<T>(dbPlugin, options);

        return new DataBridge<T>(strategy, options);
    }

    bulkOperations(event: DbPluginBulkOperationsEvent<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        this.strategy.bulkOperations(this.options, event, done);
    }

    query<TShape>(event: DbPluginQueryEvent<T, TShape>, done: (response: TShape, error?: any) => void) {
        this.strategy.query(this.options, event, done);
    }

    subscribe<TShape, U>(event: DbPluginQueryEvent<T, TShape>, done: (result: TShape, error?: any) => void) {
        const { schema } = event
        const subscription = new UniDirectionalSubscription<T>(schema.key, this.signal);
        subscription.onMessage((changes) => {

            // Make sure something in the subscribed query changed, 
            // if it has, we need to requery so we can send all changes
            if (changes.length > 0) {

                // create a new plugin where we can quickly persist the changes and then query them
                const ephemeralPlugin = new MemoryPlugin(uuidv4());

                // seed the db, we don't care about bulk operations here, we just want to query the data
                ephemeralPlugin.seed(schema, changes);

                // query the temp db to check and see if items match the query
                ephemeralPlugin.query(event, (r, e) => {

                    ephemeralPlugin.destroy(() => { });

                    if (e != null) {
                        done(null, e);
                        return;
                    }

                    if (r == null || (Array.isArray(r) && r.length === 0)) {
                        return;
                    }

                    // If the query returns results, we need to query the db to find all records
                    this.query(event, done);
                });
            }
        });

        return () => subscription[Symbol.dispose]();
    }
}