import { EntityMap } from "../types";
import { SelectionQueryable } from "./SelectionQueryable";
import { ShapedQueryable } from "./ShapedQueryable";
import { QueryOrdering } from "./types";

export class OrderedQueryable<T extends {}> extends SelectionQueryable<T> {

    sort(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Ascending });
        return new OrderedQueryable<T>(this);
    }

    sortDescending(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Descending });
        return new OrderedQueryable<T>(this);
    }

    map<R extends T[keyof T] | Partial<T>>(expression: EntityMap<T, R>) {
        this.mapValue = expression;
        return new ShapedQueryable<R>(this as any);
    }
}