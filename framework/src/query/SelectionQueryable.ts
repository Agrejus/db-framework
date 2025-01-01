import { QueryResult, Filter } from "../types";
import { createPromise } from "../utilities";
import { AggregateQueryable } from "./AggregateQueryable";

export class SelectionQueryable<T extends {}> extends AggregateQueryable<T> {

    toArray(done: QueryResult<T[]>) {
       this.getData(done)
    }

    toArrayAsync(): Promise<T[]> {
        return createPromise<T[]>(w => this.toArray(w));
    }

    // need to add params expressions to everything below
    // where(expression: Filter<T>): Queryable<T>;
    // where<P extends {}>(selector: ParamsFilter<T, P>, params: P): ParamsQueryable<T>;
    // where<P extends {} = never>(selector: ParamsFilter<T, P> | Filter<T>, params?: P) {
    //     if (params == null) {
    //         this.queries.push(selector as Filter<T>);
    //         return new Queryable<T>(this);
    //     }

    //     this.paramsQueries.push({ expression: selector as ParamsFilter<T, P>, params });

    //     return new ParamsQueryable<T>(this);
    // }

    // FIRST SHOULD CALL take(1) to ensure we only return 1 record
    first(expression: Filter<T>, done: QueryResult<T>): void;
    first(done: (value: T, error?: any) => void): void;
    first(doneOrExpression: Filter<T> | QueryResult<T>, done?: QueryResult<T>) {
        if (done != null) {

        }
    }

    firstAsync(expression: Filter<T>): Promise<T>;
    firstAsync(): Promise<T>;
    firstAsync(expression?: Filter<T>): Promise<T> {
        return createPromise<T>(w => this.first(expression as Filter<T>, w));
    }

    firstOrUndefined(expression: Filter<T>, done: QueryResult<T | undefined>): void;
    firstOrUndefined(done: QueryResult<T | undefined>): void;
    firstOrUndefined(doneOrExpression: Filter<T> | QueryResult<T | undefined>, done?: QueryResult<T | undefined>) {

    }

    firstOrUndefinedAsync(expression: Filter<T>): Promise<T | undefined>;
    firstOrUndefinedAsync(): Promise<T | undefined>;
    firstOrUndefinedAsync(expression?: Filter<T>): Promise<T | undefined> {
        return createPromise<T | undefined>(w => this.firstOrUndefined(expression as Filter<T>, w));
    }

    some(expression: Filter<T>, done: QueryResult<boolean>) {

    }

    someAsync(expression: Filter<T>): Promise<boolean> {
        return createPromise<boolean>(w => this.some(expression, w));
    }

    every(expression: Filter<T>, done: QueryResult<boolean>) {

    }

    everyAsync(expression: Filter<T>): Promise<boolean> {
        return createPromise<boolean>(w => this.every(expression, w));
    }
}