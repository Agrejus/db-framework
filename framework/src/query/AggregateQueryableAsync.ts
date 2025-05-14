import { InferType } from "@agrejus/db-framework-core";
import { createPromise } from "../utilities";
import { AggregateQueryable } from "./AggregateQueryable";

export class AggregateQueryableAsync<T extends {}> extends AggregateQueryable<T> {

    minAsync() {
        return createPromise<InferType<T>>(w => this.min(w));
    }

    maxAsync() {
        return createPromise<InferType<T>>(w => this.max(w));
    }

    sumAsync() {
        return createPromise<number>(w => this.sum(w));
    }

    countAsync() {
        return createPromise<number>(w => this.count(w));
    }

    distinctAsync() {
        return createPromise<InferType<T>[]>(w => this.distinct(w));
    }
}