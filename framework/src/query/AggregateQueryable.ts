import { NonNullEntity } from "@agrejus/db-framework-core";
import { QueryResult } from "../types";
import { createPromise } from "../utilities";
import { QueryRoot } from './base/QueryRoot';

export class AggregateQueryable<T extends {}> extends QueryRoot<T> {

    min(done: QueryResult<T>) {
        this.minValue = true;
    }

    minAsync(): Promise<T> {
        return createPromise<T>(w => this.min(w));
    }

    max(done: QueryResult<T>) {
        this.maxValue = true;
    }

    maxAsync() {
        return createPromise<T>(w => this.max(w));
    }

    sum(done: QueryResult<number>) {
        this.sumValue = true;
    }

    sumAsync() {
        return createPromise<number>(w => this.sum(w));
    }

    count(done: QueryResult<number>) {
        this.countValue = true;
    }

    countAsync() {
        return createPromise<number>(w => this.count(w));
    }

    distinct(done: QueryResult<T>) {
        this.distinctValue = true;
    }

    distinctAsync() {
        return createPromise<T>(w => this.distinct(w));
    }
}