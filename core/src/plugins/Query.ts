import { Expression, Filter, Filterable, ParamsFilter } from '../expressions/types';
import { CompiledSchema } from '../schema';
import { IQuery, QueryOptions } from './types';

export class Query<TEntity extends {}, TShape extends any = TEntity> implements IQuery<TEntity, TShape> {

    readonly schema: CompiledSchema<TEntity>;
    readonly options: QueryOptions;
    readonly filters: Filterable<TShape, any>[];
    readonly expression?: Expression;

    constructor(
        schema: CompiledSchema<TEntity>,
        options: QueryOptions,
        filters: Filterable<TShape, any>[],
        expression?: Expression
    ) {
        this.schema = schema;
        this.options = options;
        this.filters = filters;
        this.expression = expression;
    }

    // boolean value whether or not change tracking can be enabled on the query result
    get changeTracking(): boolean {

        if (this.options.fields?.length != null && this.options.fields.length > 0) {
            return false
        }

        if (this.options.count === true ||
            this.options.max === true ||
            this.options.min === true ||
            this.options.sum === true) {
            return false
        }

        return true;
    }

    filter(data: TShape): TShape {

        // Memory Filtering Fallback
        if (this.expression == null && this.filters.length > 0) {

            if (Array.isArray(data) === false) {
                return data;
            }

            let result: any[] = data;

            for (let i = 0, length = this.filters.length; i < length; i++) {
                if (this.filters[i].params == null) {
                    // standard filtering
                    const selector = this.filters[i].filter as Filter<TShape>
                    result = data.filter(selector);
                    continue;
                }

                // params filtering
                const selector = this.filters[i].filter as ParamsFilter<TShape, any>
                result = data.filter(w => selector([w, this.filters[i].params]));
            }

            return result as TShape;
        }

        // Plugin did filtering
        return data;
    }

    static all<T extends {}, TShape extends any = T>(schema: CompiledSchema<T>) {
        return new Query<T, TShape>(schema, {}, []);
    }
}