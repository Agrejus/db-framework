import { InferType } from "@agrejus/db-framework-core";
import { QueryResult } from "../types";
import { QueryRoot } from './base/QueryRoot';

export class AggregateQueryable<T extends {}, U = void> extends QueryRoot<T> {

    // need to infer the type here due to mapping .map()
    min(done: QueryResult<InferType<T>>): U {
        this.minValue = true;

        this.getData<InferType<T>>((r, e) => {
            if (e) {
                done(null, e);
                return;
            };

            done(r)
        });

        return this.subscribeQuery<InferType<T>>((r, e) => {
            if (r == null) {
                done(null, new Error("Could not find entity in query"))
                return;
            }

            done(r, e);
        }) as U;
    }

    max(done: QueryResult<InferType<T>>): U {
        this.maxValue = true;

        this.getData<InferType<T>>((r, e) => {
            if (e) {
                done(null, e);
                return;
            };

            done(r)
        });

        return this.subscribeQuery<InferType<T>>((r, e) => {
            if (r == null) {
                done(null, new Error("Could not find entity in query"))
                return;
            }

            done(r, e);
        }) as U;
    }

    sum(done: QueryResult<number>): U {
        this.sumValue = true;

        this.getData<number>((r, e) => {
            if (e) {
                done(null, e);
                return;
            };

            done(r)
        });

        return this.subscribeQuery<number>((r, e) => {
            if (r == null) {
                done(null, new Error("Could not find entity in query"))
                return;
            }

            done(r, e);
        }) as U;
    }

    // we will want to handle this better with SQL, that will return just a number, not items
    count(done: QueryResult<number>): U {
        this.countValue = true;

        this.getData<number>((r, e) => {
            if (e) {
                done(null, e);
                return;
            };

            done(r)
        });

        return this.subscribeQuery<number>((r, e) => {
            if (r == null) {
                done(null, new Error("Could not find entity in query"))
                return;
            }

            done(r, e);
        }) as U;
    }

    distinct(done: QueryResult<InferType<T>[]>): U {
        this.distinctValue = true;

        this.getData<InferType<T>[]>((r, e) => {
            if (e) {
                done(null, e);
                return;
            };

            done(r)
        });

        return this.subscribeQuery<InferType<T>[]>((r, e) => {
            if (r == null) {
                done(null, new Error("Could not find entity in query"))
                return;
            }

            done(r, e);
        }) as U;
    }
}