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

    // filter<TShape>(query: Query<T, TShape>, data: InferType<T>[]): InferType<T>[] {

    //     if (query.filters.length === 0) {
    //         return data;
    //     }

    //     const result: InferType<T>[] = [];

    //     for (let i = 0, length = query.filters.length; i < length; i++) {

    //         const filter = query.filters[i];
    //         if (filter.params == null) {
    //             // standard filtering
    //             const selector = filter.filter as Filter<InferType<T>>;
    //             result.push(...data.filter(selector));
    //             continue;
    //         }

    //         // params filtering
    //         const selector = filter.filter as ParamsFilter<InferType<T>, any>
    //         result.push(...data.filter(w => selector([w, filter.params])));
    //     }

    //     return data;
    // }
}