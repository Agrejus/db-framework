import { EntityMap } from "../types";
import { LimitedQueryable } from "./LimitedQueryable";
import { OrderedQueryable } from "./OrderedQueryable";
import { SelectionQueryable } from "./SelectionQueryable";
import { SkippedQueryable } from "./SkippedQueryable";
import { QueryOrdering } from "./types";

export class ShapedQueryable<T extends {}> extends SelectionQueryable<T> {

    skip(amount: number) {
        this.skipValue = amount;
        return new SkippedQueryable<T>(this);
    }

    take(amount: number) {
        this.takeValue = amount;
        return new LimitedQueryable<T>(this)
    }

    order(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Ascending });
        return new OrderedQueryable<T>(this);
    }

    orderDescending(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Descending });
        return new OrderedQueryable<T>(this);
    }
}
