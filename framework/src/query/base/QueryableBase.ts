import { EntityMap } from "../../types";
import { AggregateQueryable } from "../AggregateQueryable";
import { LimitedQueryable } from "../LimitedQueryable";
import { OrderedQueryable } from "../OrderedQueryable";
import { SelectionQueryable } from "../SelectionQueryable";
import { ShapedQueryable } from "../ShapedQueryable";
import { SkippedQueryable } from "../SkippedQueryable";
import { QueryOrdering } from "../types";

export class QueryableBase<T extends {}> extends SelectionQueryable<T> {

    map<R extends T[keyof T] | Partial<T>>(expression: EntityMap<T, R>) {
        this.mapValue = expression;
        return new ShapedQueryable<R>(this as any);
    }

    skip(amount: number) {
        this.skipValue = amount;
        return new SkippedQueryable<T>(this);
    }

    take(amount: number) {
        this.takeValue = amount;
        return new LimitedQueryable<T>(this)
    }

    min() {
        this.minValue = true;
        return new AggregateQueryable<T>(this);
    }

    max() {
        this.maxValue = true;
        return new AggregateQueryable<T>(this);
    }

    sum() {
        this.sumValue = true;
        return new AggregateQueryable<T>(this);
    }

    count() {
        this.countValue = true;
        return new AggregateQueryable<T>(this);
    }

    distinct() {
        this.distinctValue = true;
        return new AggregateQueryable<T>(this);
    }

    order(expression: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector: expression, direction: QueryOrdering.Ascending });
        return new OrderedQueryable<T>(this);
    }

    orderDescending(expression: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector: expression, direction: QueryOrdering.Descending });
        return new OrderedQueryable<T>(this);
    }
}
