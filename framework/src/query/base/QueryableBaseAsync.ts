import { EntityMap } from "../../types";
import { LimitedQueryableAsync } from "../LimitedQueryableAsync";
import { OrderedQueryableAsync } from "../OrderedQueryableAsync";
import { SelectionQueryableAsync } from "../SelectionQueryableAsync";
import { ShapedQueryableAsync } from "../ShapedQueryableAsync";
import { SkippedQueryableAsync } from "../SkippedQueryableAsync";
import { QueryOrdering } from "../types";

export class QueryableBaseAsync<T extends {}> extends SelectionQueryableAsync<T> {

    map<R extends T[keyof T] | Partial<T>>(expression: EntityMap<T, R>) {
        this.mapValue = expression;
        return new ShapedQueryableAsync<R>(this as any);
    }

    skip(amount: number) {
        this.skipValue = amount;
        return new SkippedQueryableAsync<T>(this);
    }

    take(amount: number) {
        this.takeValue = amount;
        return new LimitedQueryableAsync<T>(this)
    }

    order(expression: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector: expression, direction: QueryOrdering.Ascending });
        return new OrderedQueryableAsync<T>(this);
    }

    orderDescending(expression: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector: expression, direction: QueryOrdering.Descending });
        return new OrderedQueryableAsync<T>(this);
    }
}
