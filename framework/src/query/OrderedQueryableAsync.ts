import { EntityMap } from "../types";
import { SelectionQueryableAsync } from "./SelectionQueryableAsync";
import { ShapedQueryableAsync } from "./ShapedQueryableAsync";
import { QueryOrdering } from "./types";

export class OrderedQueryableAsync<T extends {}> extends SelectionQueryableAsync<T> {

    sort(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Ascending });
        return new OrderedQueryableAsync<T>({ queryable: this });
    }

    sortDescending(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Descending });
        return new OrderedQueryableAsync<T>({ queryable: this });
    }

    map<R extends T[keyof T] | Partial<T>>(expression: EntityMap<T, R>) {
        this.mapValue = expression;
        return new ShapedQueryableAsync<R>({ queryable: this as any });
    }
}