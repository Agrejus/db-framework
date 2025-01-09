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

    count(done: QueryResult<number>): U {
        this.countValue = true;
        return;
    }

    distinct(done: QueryResult<T>): U {
        this.distinctValue = true;
        return;
    }
}