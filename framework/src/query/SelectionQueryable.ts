import { QueryResult, Filter, ParamsFilter } from "../types";
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
    first<P extends {}>(expression: ParamsFilter<T, P>, params: P, done: QueryResult<T>): void;
    first(done: QueryResult<T>): void;
    first<P extends {} = never>(doneOrExpression: Filter<T> | ParamsFilter<T, P> | QueryResult<T>, paramsOrDone?: P | QueryResult<T>, done?: QueryResult<T>) {

        this.takeValue = 1; // ensure we only select 1 record

        this._query({
            doneOrExpression,
            done,
            paramsOrDone
        }, (d, r, e) => {
            if (r.length === 0) {
                d(undefined, new Error("Could not find entity in query"))
                return;
            }

            d(r[0], e)
        });
    }

    firstAsync(expression: Filter<T>): Promise<T>;
    firstAsync<P extends {}>(expression: ParamsFilter<T, P>, params: P): Promise<T>;
    firstAsync(): Promise<T>;
    firstAsync<P extends {} = never>(expression?: Filter<T> | ParamsFilter<T, P>, params?: P): Promise<T> {
        return createPromise<T>(w => {

            if (params == null && expression == null) {
                this.first(w);
                return;
            }

            if (params != null) {
                this.first(expression as ParamsFilter<T, P>, params, w);
                return
            }

            this.first(expression as Filter<T>, w);
        });
    }

    firstOrUndefined(expression: Filter<T>, done: QueryResult<T | undefined>): void;
    firstOrUndefined<P extends {}>(expression: ParamsFilter<T, P>, params: P, done: QueryResult<T | undefined>): void;
    firstOrUndefined(done: QueryResult<T | undefined>): void;
    firstOrUndefined<P extends {} = never>(doneOrExpression: Filter<T> | ParamsFilter<T, P> | QueryResult<T | undefined>, paramsOrDone?: P | QueryResult<T | undefined>, done?: QueryResult<T | undefined>) {
        this.takeValue = 1; // ensure we only select 1 record

        this._query({
            doneOrExpression,
            done,
            paramsOrDone
        }, (d, r, e) => {
            if (r.length === 0) {
                d(undefined, e)
                return;
            }

            d(r[0], e)
        });
    }

    firstOrUndefinedAsync(expression: Filter<T>): Promise<T | undefined>;
    firstOrUndefinedAsync<P extends {}>(expression: ParamsFilter<T, P>, params: P): Promise<T | undefined>;
    firstOrUndefinedAsync(): Promise<T | undefined>;
    firstOrUndefinedAsync<P extends {} = never>(expression?: Filter<T> | ParamsFilter<T, P>, params?: P): Promise<T | undefined> {
        return createPromise<T>(w => {

            if (params == null && expression == null) {
                this.firstOrUndefined(w);
                return;
            }

            if (params != null) {
                this.firstOrUndefined(expression as ParamsFilter<T, P>, params, w);
                return
            }

            this.firstOrUndefined(expression as Filter<T>, w);
        });
    }

    some(expression: Filter<T>, done: QueryResult<boolean>): void;
    some<P extends {}>(expression: ParamsFilter<T, P>, params: P, done: QueryResult<boolean>): void;
    some(done: QueryResult<boolean>): void;
    some<P extends {} = never>(doneOrExpression: Filter<T> | ParamsFilter<T, P> | QueryResult<boolean>, paramsOrDone?: P | QueryResult<boolean>, done?: QueryResult<boolean>) {
        this.takeValue = 1; // ensure we only select 1 record

        this._query({
            doneOrExpression,
            done,
            paramsOrDone
        }, (d, r, e) => d(r.length > 0, e));
    }

    someAsync(expression: Filter<T>): Promise<boolean>;
    someAsync<P extends {}>(expression: ParamsFilter<T, P>, params: P): Promise<boolean>;
    someAsync(): Promise<boolean>;
    someAsync<P extends {} = never>(expression?: Filter<T> | ParamsFilter<T, P>, params?: P): Promise<boolean> {
        return createPromise<boolean>(w => {

            if (params == null && expression == null) {
                this.some(w);
                return;
            }

            if (params != null) {
                this.some(expression as ParamsFilter<T, P>, params, w);
                return
            }

            this.some(expression as Filter<T>, w);
        });
    }

    every(expression: Filter<T>, done: QueryResult<boolean>): void;
    every<P extends {}>(expression: ParamsFilter<T, P>, params: P, done: QueryResult<boolean>): void;
    every<P extends {} = never>(expression: Filter<T> | ParamsFilter<T, P> | QueryResult<boolean>, paramsOrDone?: P | QueryResult<boolean>, done?: QueryResult<boolean>) {
        
        // Need to select everything
        const coalescedDone = done != null ? done : (paramsOrDone as QueryResult<boolean>);
        this._query({
            doneOrExpression: coalescedDone
        }, (d, r, e) => {

            if (done != null) {
                // params query
                const params = paramsOrDone as P
                const paramsExpression = expression as ParamsFilter<T, P>;
                const result = r.filter(w => paramsExpression([w, params]));

                d(result.length === r.length, e);
                return;
            }

            // regular query
            const regularExpression = expression as Filter<T>;
            const result = r.filter(regularExpression);

                d(result.length === r.length, e);
            d(r.length > 0, e)
        });
    }

    everyAsync(expression: Filter<T>): Promise<boolean>;
    everyAsync<P extends {}>(expression: ParamsFilter<T, P>, params: P): Promise<boolean>;
    everyAsync<P extends {} = never>(expression?: Filter<T> | ParamsFilter<T, P>, params?: P): Promise<boolean> {
        return createPromise<boolean>(w => {

            if (params != null) {
                this.every(expression as ParamsFilter<T, P>, params, w);
                return
            }

            this.every(expression as Filter<T>, w);
        });
    }

    private _query<P extends {}, R extends {}>(options: {
        doneOrExpression: Filter<T> | ParamsFilter<T, P> | QueryResult<R>,
        paramsOrDone?: P | QueryResult<R>,
        done?: QueryResult<R>
    }, resolve: (done: QueryResult<R>, data: T[], error?: any) => void) {

        const { doneOrExpression, done, paramsOrDone } = options;

        if (done == null && paramsOrDone == null) {
            // empty query
            const d = doneOrExpression as QueryResult<R>;
            this.getData((r, e) => {
                if (!e) {
                    resolve(d, r, e);
                    return;
                }
                resolve(d, [], e);
            });
            return;
        }

        if (done != null) {
            // params query
            this.paramsQueries.push({ expression: doneOrExpression as ParamsFilter<T, P>, params: paramsOrDone as P });
            this.getData((r, e) => {
                if (!e) {
                    resolve(done, r, e);
                    return;
                }
                resolve(done, [], e);
            });
            return;
        }

        // regular query
        const d = paramsOrDone as QueryResult<R>;
        this.queries.push(doneOrExpression as Filter<T>)
        this.getData((r, e) => {
            if (!e) {
                resolve(d, r, e);
                return;
            }
            resolve(d, [], e);
        });
    }
}