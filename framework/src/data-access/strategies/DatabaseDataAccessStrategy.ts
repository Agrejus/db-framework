import { CompiledSchema, EntityChanges, EntityModificationResult, Query } from "@agrejus/db-framework-core";
import { IDataAccessStrategy } from "../types";
import { DataAccessStrategyBase } from "./DataAccessStrategyBase";

export class DatabaseDataAccessStrategy<T extends {}> extends DataAccessStrategyBase<T> implements IDataAccessStrategy<T> {

    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        super._bulkOperations(schema, operations, done);
    }

    fetch<TShape>(query: Query<T, TShape>, done: (response: TShape, error?: any) => void) {
        this.dbPlugin.query<T, TShape>(query, done);
    }
}