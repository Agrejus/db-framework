import { QueryOptions, toExpression, Expression, combineExpressions, QueryField, Query, QuerySort, Filterable } from "@agrejus/db-framework-core";
import { EntityMap } from "../../types";
import { QueryOrdering } from "../types";
import { IDataAccessManager } from '../../data-access/types';

export abstract class QueryRoot<T extends {}> {

    protected readonly manager: IDataAccessManager<T>;
    protected filters: Filterable<T, any>[] = [];
    protected mapValue: EntityMap<T, T[keyof T] | Partial<T>> | null = null;
    protected takeValue: number | null = null;
    protected skipValue: number | null = null;
    protected sorting: { direction: QueryOrdering, selector: EntityMap<T, T[keyof T]> }[] = [];
    protected minValue: boolean = false
    protected maxValue: boolean = false
    protected countValue: boolean = false
    protected sumValue: boolean = false;
    protected distinctValue: boolean = false;
    protected subscribeValue: boolean = false;
    private _compiledQuery: Query<T> | null = null;

    constructor(queryable?: QueryRoot<T>, manager?: IDataAccessManager<T>) {

        if (manager != null) {
            this.manager = manager;
        }

        if (queryable != null) {
            this.subscribeValue = queryable.subscribeValue;
            this.manager = queryable.manager;
            this.filters = queryable.filters;
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

    protected subscribeQuery<U>(shape: (data: T[]) => U, done: (result: U, error?: any) => void) {

        if (this.subscribeValue === false) {
            return;
        }

        const query = this.getOrCompileQuery();

        return this.manager.subscribe(query, shape, done);
    }

    private _getSorting(sorting: { direction: QueryOrdering, selector: EntityMap<T, T[keyof T]> }[]) {
        return sorting.map(sort => {
            const propertyName = this._getSortPropertyName(sort.selector);

            return { direction: sort.direction, key: propertyName }
        });
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
            return properties.map(property => {
                const [destinationName, sourcePathAndName] = property.split(":").map(w => w.trim());
                const sourceName = this._extractPropertyName(sourcePathAndName);

                return { sourceName, destinationName };
            })
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

    private _convertToExpression(filter: Filterable<T>) {

        if (filter.params != null) {
            return toExpression(this.manager.schema, filter.filter, filter.params);
        }

        try {
            return toExpression(this.manager.schema, filter.filter, {});
        } catch (e) {
            console.warn(`[WARNING] - Failed to parse selector to expression, falling back to memory filtering.  Selector: ${filter.filter.toString()}, Params: ${JSON.stringify(filter.params ?? {})}`)
            return null; // fallback to memory filtering
        }
    }

    protected getExpression(): Expression | null {

        if (this.filters.length === 0) {
            return null;
        }

        const expressions: Expression[] = [];

        for (let i = 0; i < this.filters.length; i++) {
            const filter = this.filters[i];
            const expression = this._convertToExpression(filter);

            if (expression == null) {
                return null; // fall back to memory filtering for everything
            }

            expressions.push(expression);
        }

        return combineExpressions(...expressions);
    }

    protected getOrCompileQuery() {

        if (this._compiledQuery != null) {
            return this._compiledQuery;
        }

        const expression = this.getExpression();
        const options = this.getQueryOptions();

        this._compiledQuery = {
            schema: this.manager.schema,
            options,
            filters: this.filters
        }

        if (expression != null) {
            this._compiledQuery.expression = expression;
        }

        return this._compiledQuery;
    }

    protected getData(done: (result: T[], error?: any) => void) {

        const query = this.getOrCompileQuery();

        this.manager.fetch(query, done);
    }
}   