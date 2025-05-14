import { CompiledSchema, EntityChanges, EntityModificationResult, Filter, Filterable, IDbPlugin, InferType, ParamsFilter, Query } from "@agrejus/db-framework-core";

export class DataAccessStrategyBase<T extends {}> {

    protected readonly schema: CompiledSchema<T>;
    protected readonly dbPlugin: IDbPlugin;

    constructor(schema: CompiledSchema<T>, dbPlugin: IDbPlugin) {
        this.schema = schema;
        this.dbPlugin = dbPlugin;
    }

    protected _bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        this.dbPlugin.bulkOperations(schema, operations, done);
    }
}