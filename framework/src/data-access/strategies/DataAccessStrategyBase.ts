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

    protected _fetch<TShape>(query: Query<TShape, T>, done: (response: { result: TShape | null, shouldEnableChangeTracking: boolean }, error?: any) => void) {
        this.dbPlugin.query<TShape>(query, (r, e) => {

            if (!e) {
                const result = this._applyQueryExpressionAndFiltering(r, query);
                const shouldEnableChangeTracking = this._shouldEnableChangeTracking(query);

                done({ result, shouldEnableChangeTracking });
                return;
            }

            done({ result: null, shouldEnableChangeTracking: false }, e);
        });
    }

    filter<TShape>(query: Query<TShape, T>, data: InferType<T>[]): InferType<T>[] {

        if (query.filters.length === 0) {
            return data;
        }

        const result: InferType<T>[] = [];

        for (let i = 0, length = query.filters.length; i < length; i++) {

            const filter = query.filters[i];
            if (filter.params == null) {
                // standard filtering
                const selector = filter.filter as Filter<InferType<T>>;
                result.push(...data.filter(selector));
                continue;
            }

            // params filtering
            const selector = filter.filter as ParamsFilter<InferType<T>, any>
            result.push(...data.filter(w => selector([w, filter.params])));
        }

        return data;
    }

    protected _shouldEnableChangeTracking<TShape>(query: Query<TShape, T>) {

        // we can only enable change tracking when we do not change (reduce/aggregate) the response
        // from the database
        return query.options.fields?.length == null || query.options.fields.length === 0;
    }

    protected _applyFiltering<TShape>(data: TShape, filters: Filterable<TShape, any>[]): TShape {

        if (Array.isArray(data)) {
            let result: any[] = data;

            for (let i = 0, length = filters.length; i < length; i++) {
                if (filters[i].params == null) {
                    // standard filtering
                    const selector = filters[i].filter as Filter<TShape>
                    result = data.filter(selector);
                    return;
                }

                // params filtering
                const selector = filters[i].filter as ParamsFilter<T, any>
                result = data.filter(w => selector([w, filters[i].params]));
            }

            return result as TShape;
        }

        return data;
    }

    protected _applyQueryExpressionAndFiltering<TShape>(data: TShape, query: Query<TShape, T>): TShape {

        // Memory Filtering Fallback
        if (query.expression == null && query.filters.length > 0) {
            return this._applyFiltering(data, query.filters);
        }

        return data;
    }
}