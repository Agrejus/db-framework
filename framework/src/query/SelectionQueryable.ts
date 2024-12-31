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

    first(expression: Filter<T>, done: QueryResult<T>): void;
    first(done: (value: T, error?: any) => void): void;
    first(doneOrExpression: Filter<T> | QueryResult<T>, done?: QueryResult<T>) {

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