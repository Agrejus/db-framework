import { EntityMap } from "../types";
import { AggregateQueryableAsync } from "./AggregateQueryableAsync";
import { LimitedQueryableAsync } from "./LimitedQueryableAsync";
import { OrderedQueryableAsync } from "./OrderedQueryableAsync";
import { SelectionQueryableAsync } from "./SelectionQueryableAsync";
import { SkippedQueryableAsync } from "./SkippedQueryableAsync";
import { QueryOrdering } from "./types";

export class ShapedQueryableAsync<T extends {}> extends SelectionQueryableAsync<T> {

    skip(amount: number) {
        this.skipValue = amount;
        return new SkippedQueryableAsync<T>(this);
    }

    take(amount: number) {
        this.takeValue = amount;
        return new LimitedQueryableAsync<T>(this)
    }

    min() {
        this.minValue = true;
        return new AggregateQueryableAsync<T>(this);
    }

    max() {
        this.maxValue = true;
        return new AggregateQueryableAsync<T>(this);
    }

    sum() {
        this.sumValue = true;
        return new AggregateQueryableAsync<T>(this);
    }

    count() {
        this.countValue = true;
        return new AggregateQueryableAsync<T>(this);
    }

    distinct() {
        this.distinctValue = true;
        return new AggregateQueryableAsync<T>(this);
    }

    order(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Ascending });
        return new OrderedQueryableAsync<T>(this);
    }

    orderDescending(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Descending });
        return new OrderedQueryableAsync<T>(this);
    }
}
