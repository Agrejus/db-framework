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

    static all<T extends {}, TShape extends any = T>(schema: CompiledSchema<T>) {
        return new Query<T, TShape>(schema, {}, []);
    }
}