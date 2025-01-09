import { EntityMap } from "../types";
import { AggregateQueryable } from "./AggregateQueryable";
import { LimitedQueryable } from "./LimitedQueryable";
import { OrderedQueryable } from "./OrderedQueryable";
import { SelectionQueryable } from "./SelectionQueryable";
import { SkippedQueryable } from "./SkippedQueryable";
import { QueryOrdering } from "./types";

export class ShapedQueryable<T extends {}, U = void> extends SelectionQueryable<T> {

    skip(amount: number) {
        this.skipValue = amount;
        return new SkippedQueryable<T, U>(this);
    }

    take(amount: number) {
        this.takeValue = amount;
        return new LimitedQueryable<T, U>(this)
    }

    min() {
        this.minValue = true;
        return new AggregateQueryable<T, U>(this);
    }

    max() {
        this.maxValue = true;
        return new AggregateQueryable<T, U>(this);
    }

    sum() {
        this.sumValue = true;
        return new AggregateQueryable<T>(this);
    }

    count() {
        this.countValue = true;
        return new AggregateQueryable<T, U>(this);
    }

    distinct() {
        this.distinctValue = true;
        return new AggregateQueryable<T, U>(this);
    }

    order(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Ascending });
        return new OrderedQueryable<T, U>(this);
    }

    orderDescending(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Descending });
        return new OrderedQueryable<T, U>(this);
    }
}
