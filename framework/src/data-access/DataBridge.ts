import { CompiledSchema, EntityChanges, EntityModificationResult, IDbPlugin, Query } from "@agrejus/db-framework-core";
import { DbSetOptions } from "../types";
import { StatefulDataAccessStrategy } from "./strategies/StatefulDataAccessStrategy";
import { DatabaseDataAccessStrategy } from "./strategies/DatabaseDataAccessStrategy";
import { IDataAccessStrategy } from "./types";

export class DataBridge<T extends {}> {

    private readonly strategy: IDataAccessStrategy<T>;
    readonly schema: CompiledSchema<T>;

    constructor(strategy: IDataAccessStrategy<T>, schema: CompiledSchema<T>) {
        this.strategy = strategy;
        this.schema = schema;
    }

    private static createStrategy<T extends {}>(schema: CompiledSchema<T>, dbPlugin: IDbPlugin, options: DbSetOptions) {
        if (options.stateful === true) {
            return new StatefulDataAccessStrategy(schema, dbPlugin);
        }

        return new DatabaseDataAccessStrategy(schema, dbPlugin);
    }

    static create<T extends {}>(schema: CompiledSchema<T>, dbPlugin: IDbPlugin, options: DbSetOptions) {
        const strategy = DataBridge.createStrategy(schema, dbPlugin, options);

        return new DataBridge<T>(strategy, schema);
    }

    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        this.strategy.bulkOperations(schema, operations, done);
    }

    fetch(query: Query<T>, done: (response: { result: T[], shouldEnableChangeTracking: boolean }, error?: any) => void) {
        this.strategy.fetch(query, done);
    }
}