import { Filter, ParamsFilter } from "@agrejus/db-framework-core";
import { QueryResult } from "../types";
import { AggregateQueryable } from "./AggregateQueryable";

export class SelectionQueryable<T extends {}, U = void> extends AggregateQueryable<T> {

    toArray(done: QueryResult<T[]>): U {
        this.getData(done);
        return this.subscribeQuery<T[]>(w => w, done) as U;
    }

    first(expression: Filter<T>, done: QueryResult<T>): U;
    first<P extends {}>(expression: ParamsFilter<T, P>, params: P, done: QueryResult<T>): U;
    first(done: QueryResult<T>): U;
    first<P extends {} = never>(doneOrExpression: Filter<T> | ParamsFilter<T, P> | QueryResult<T>, paramsOrDone?: P | QueryResult<T>, done?: QueryResult<T>): U {

        this.takeValue = 1; // ensure we only select 1 record

        const shaper = (r: T[]) => {
            if (r.length === 0) {
                return undefined
            }

            return r[0];
        }

        this._query({
            doneOrExpression,
            done,
            paramsOrDone
        }, (d, r, e) => {
            const result = shaper(r);

            if (result == null) {
                d(undefined, new Error("Could not find entity in query"))
                return;
            }

            d(result, e)
        });

        const d = done != null ? done : paramsOrDone != null ? paramsOrDone as QueryResult<T> : doneOrExpression as QueryResult<T>;
        return this.subscribeQuery<T>(shaper, (r, e) => {
            if (r == null) {
                d(undefined, new Error("Could not find entity in query"))
                return;
            }

            d(r, e);
        }) as U;
    }

    firstOrUndefined(expression: Filter<T>, done: QueryResult<T | undefined>): U;
    firstOrUndefined<P extends {}>(expression: ParamsFilter<T, P>, params: P, done: QueryResult<T | undefined>): U;
    firstOrUndefined(done: QueryResult<T | undefined>): U;
    firstOrUndefined<P extends {} = never>(doneOrExpression: Filter<T> | ParamsFilter<T, P> | QueryResult<T | undefined>, paramsOrDone?: P | QueryResult<T | undefined>, done?: QueryResult<T | undefined>): U {

        this.takeValue = 1; // ensure we only select 1 record

        const shaper = (r: T[]) => {
            if (r.length === 0) {
                return undefined
            }

            return r[0];
        }

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

        const d = done != null ? done : paramsOrDone != null ? paramsOrDone as QueryResult<T> : doneOrExpression as QueryResult<T>;
        return this.subscribeQuery<T>(shaper, (r, e) => {
            if (r == null) {
                d(undefined, e)
                return;
            }

            d(r, e);
        }) as U;
    }

    some(expression: Filter<T>, done: QueryResult<boolean>): U;
    some<P extends {}>(expression: ParamsFilter<T, P>, params: P, done: QueryResult<boolean>): U;
    some(done: QueryResult<boolean>): U;
    some<P extends {} = never>(doneOrExpression: Filter<T> | ParamsFilter<T, P> | QueryResult<boolean>, paramsOrDone?: P | QueryResult<boolean>, done?: QueryResult<boolean>): U {
        this.takeValue = 1; // ensure we only select 1 record

        const shaper = (r: T[]) => r.length > 0;

        this._query({
            doneOrExpression,
            done,
            paramsOrDone
        }, (d, r, e) => d(shaper(r), e));

        const d = done != null ? done : paramsOrDone != null ? paramsOrDone as QueryResult<boolean> : doneOrExpression as QueryResult<boolean>;
        return this.subscribeQuery<boolean>(shaper, d) as U;
    }

    every(expression: Filter<T>, done: QueryResult<boolean>): U;
    every<P extends {}>(expression: ParamsFilter<T, P>, params: P, done: QueryResult<boolean>): U;
    every<P extends {} = never>(expression: Filter<T> | ParamsFilter<T, P> | QueryResult<boolean>, paramsOrDone?: P | QueryResult<boolean>, done?: QueryResult<boolean>): U {

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
        });

        return;
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
            this.filters.push({ filter: doneOrExpression as ParamsFilter<T, P>, params: paramsOrDone as P });
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
        this.filters.push({ filter: doneOrExpression as Filter<T> })
        this.getData((r, e) => {
            if (!e) {
                resolve(d, r, e);
                return;
            }
            resolve(d, [], e);
        });
    }
}