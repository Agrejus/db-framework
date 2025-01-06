import { CompiledSchema, IDbPlugin, QueryOptions, toExpression, Expression, combineExpressions, QueryField, Query, QuerySort } from "@agrejus/db-framework-core";
import { EntityMap, Filter, ParamsFilter } from "../../types";
import { QueryOrdering } from "../types";
import { IChangeTracker } from "../../change-tracking/types";

export abstract class QueryRoot<T extends {}> {

    protected readonly schema: CompiledSchema<T>;
    protected readonly dbPlugin: IDbPlugin;
    protected readonly changeTracker: IChangeTracker<T>;
    protected queries: Filter<T>[] = [];
    protected paramsQueries: { expression: ParamsFilter<T, any>, params: any }[] = [];
    protected mapValue: EntityMap<T, T[keyof T] | Partial<T>> | null = null;
    protected takeValue: number | null = null;
    protected skipValue: number | null = null;
    protected sorting: { direction: QueryOrdering, selector: EntityMap<T, T[keyof T]> }[] = [];
    protected minValue: boolean = false
    protected maxValue: boolean = false
    protected countValue: boolean = false
    protected sumValue: boolean = false;
    protected distinctValue: boolean = false;

    constructor(queryable?: QueryRoot<T>, options?: { schema: CompiledSchema<T>, dbPlugin: IDbPlugin, changeTracker: IChangeTracker<T> }) {

        if (options != null) {
            this.schema = options.schema;
            this.dbPlugin = options.dbPlugin;
            this.changeTracker = options.changeTracker;
        }

        if (queryable != null) {
            this.dbPlugin = queryable.dbPlugin;
            this.schema = queryable.schema;
            this.queries = queryable.queries;
            this.paramsQueries = queryable.paramsQueries;
            this.takeValue = queryable.takeValue;
            this.skipValue = queryable.skipValue;
            this.mapValue = queryable.mapValue;
            this.sorting = queryable.sorting;
            this.minValue = queryable.minValue;
            this.maxValue = queryable.maxValue;
            this.countValue = queryable.countValue;
            this.sumValue = queryable.sumValue;
            this.distinctValue = queryable.distinctValue;
        }
    }

    protected getQueryOptions(): QueryOptions {

        const fields = this._getFields(this.mapValue);
        const sort = this._getSorting(this.sorting);

        return {
            count: this.countValue,
            distinct: this.distinctValue,
            max: this.maxValue,
            min: this.minValue,
            sort,
            skip: this.skipValue,
            sum: this.sumValue,
            take: this.takeValue,
            fields
        }
    }

    private _getSorting(sorting: { direction: QueryOrdering, selector: EntityMap<T, T[keyof T]> }[]) {
        const result: QuerySort[] = [];

        for(let i = 0; i < sorting.length; i++) {
            const sort = sorting[i];

            const propertyName = this._getSortPropertyName(sort.selector);

            result.push({ direction: sort.direction, key: propertyName })
        }

        return result;
    }

    private _getSortPropertyName(selector: EntityMap<T, T[keyof T]>) {
        const stringified = selector.toString();

        if (stringified.includes("=>") === false) {
            throw new Error("Only arrow functions allowed in .map()")
        }

        const [, body] = stringified.split("=>").map(w => w.trim());

        return this._extractPropertyName(body);
    }

    private _getFields(map: EntityMap<T, T[keyof T] | Partial<T>> | null): QueryField[] {

        if (map == null) {
            return [];
        }

        const stringified = map.toString();

        if (stringified.includes("=>") === false) {
            throw new Error("Only arrow functions allowed in .map()")
        }

        const [, body] = stringified.split("=>").map(w => w.trim());

        if (body.includes("{")) {
            const properties = body.replace(/{|}|\(|\)/g, "").split(",").map(w => w.trim());
            const result: QueryField[] = [];
            for (let i = 0; i < properties.length; i++) {
                const property = properties[i];
                const [destinationName, sourcePathAndName] = property.split(":").map(w => w.trim());
                const sourceName = this._extractPropertyName(sourcePathAndName);

                result.push({ sourceName, destinationName })
            }
            return result;
        }

        const field = this._extractPropertyName(body);

        return [{
            destinationName: field,
            sourceName: field
        }];
    }

    private _extractPropertyName(value: string) {
        const split = value.split(".");

        split.shift();

        return split.join(".")
    }

    protected getExpression() {
        // I NEED SOME LOVE
        if (this.paramsQueries.length == 0) {
            // try and convert default queries
            if (this.queries.length === 0) {
                return null;
            }

            if (this.queries.length === 1) {
                try {
                    return toExpression(this.schema, this.queries[0] as any, {});
                } catch (e) {
                    return null; // fallback to memory filtering
                }
            }

            try {
                const expressions: Expression[] = [];

                for (let i = 0; i < this.queries.length; i++) {
                    const query = this.queries[i];
                    expressions.push(toExpression(this.schema, query as any, {}));
                }

                return combineExpressions(...expressions);
            } catch (e) {
                return null;
            }
        }

        if (this.paramsQueries.length === 1) {
            return toExpression(this.schema, this.paramsQueries[0].expression, this.paramsQueries[0].params)
        }

        const expressions: Expression[] = [];

        for (let i = 0; i < this.paramsQueries.length; i++) {
            const query = this.paramsQueries[i];
            expressions.push(toExpression(this.schema, query.expression, query.params));
        }

        return combineExpressions(...expressions);
    }

    protected getData(done: (result: T[], error?: any) => void) {

        const expression = this.getExpression();
        const options = this.getQueryOptions();
        const query: Query<T> = {
            schema: this.schema,
            options,
            expression
        }
        const shouldEnableChangeTracking = options.fields?.length == null || options.fields.length === 0;

        this.dbPlugin.query<T>(query, (r, e) => {

            if (!e) {
                const entities = r as T[];

                if (shouldEnableChangeTracking === true) {
                    const enriched = entities.map(w => this.schema.enrich(w as any));
                    const resolved = this.changeTracker.resolve(enriched);
                    done(resolved as T[]);
                    return;
                }

                done(entities);
                return;
            }

            done(null, e);
        });
    }
}   