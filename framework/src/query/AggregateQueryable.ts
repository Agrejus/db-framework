import { QueryResult } from "../types";
import { QueryRoot } from './base/QueryRoot';

export class AggregateQueryable<T extends {}, U = void> extends QueryRoot<T> {

    min(done: QueryResult<T>): U {
        this.minValue = true;
        return;
    }

    max(done: QueryResult<T>): U {
        this.maxValue = true;
        return;
    }

    sum(done: QueryResult<number>): U {
        this.sumValue = true;
        return;
    }

    // we will want to handle this better with SQL, that will return just a number, not items
    count(done: QueryResult<number>): U {
        this.countValue = true;

        this.getData<number>((r, e) => {
            if (e) {
                done(0, e);
                return;
            };

            done(r)
        });

        return this.subscribeQuery<number>((r, e) => {
            if (r == null) {
                done(0, new Error("Could not find entity in query"))
                return;
            }

            done(r, e);
        }) as U;
    }

    distinct(done: QueryResult<T>): U {
        this.distinctValue = true;
        return;
    }
}