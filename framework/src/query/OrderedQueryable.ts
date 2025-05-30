import { EntityMap } from "../types";
import { LimitedQueryableAsync } from "./LimitedQueryableAsync";
import { SelectionQueryable } from "./SelectionQueryable";
import { ShapedQueryable } from "./ShapedQueryable";
import { SkippedQueryableAsync } from "./SkippedQueryableAsync";
import { QueryOrdering } from "./types";

export class OrderedQueryable<T extends {}, U = void> extends SelectionQueryable<T> {

    sort(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Ascending });
        return new OrderedQueryable<T, U>(this.schema as any, this.parent, { queryable: this });
    }

    sortDescending(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Descending });
        return new OrderedQueryable<T, U>(this.schema as any, this.parent, { queryable: this });
    }

    map<R extends T[keyof T] | Partial<T>>(expression: EntityMap<T, R>) {
        this.mapValue = expression;
        return new ShapedQueryable<R, U>(this.schema as any, this.parent, { queryable: this } as any);
    }

    skip(amount: number) {
        this.skipValue = amount;
        return new SkippedQueryableAsync<T>(this.schema as any, this.parent, { queryable: this });
    }

    take(amount: number) {
        this.takeValue = amount;
        return new LimitedQueryableAsync<T>(this.schema as any, this.parent, { queryable: this })
    }
}