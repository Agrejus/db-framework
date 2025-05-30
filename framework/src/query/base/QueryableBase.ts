import { EntityMap } from "../../types";
import { LimitedQueryable } from "../LimitedQueryable";
import { OrderedQueryable } from "../OrderedQueryable";
import { SelectionQueryable } from "../SelectionQueryable";
import { ShapedQueryable } from "../ShapedQueryable";
import { SkippedQueryable } from "../SkippedQueryable";
import { QueryOrdering } from "../types";

export class QueryableBase<T extends {}, U = void> extends SelectionQueryable<T, U> {

    map<R extends T[keyof T] | Partial<T>>(expression: EntityMap<T, R>) {
        this.mapValue = expression;
        return new ShapedQueryable<R, U>(this.schema as any, this.parent, { queryable: this as any });
    }

    skip(amount: number) {
        this.skipValue = amount;
        return new SkippedQueryable<T, U>(this.schema as any, this.parent, { queryable: this });
    }

    take(amount: number) {
        this.takeValue = amount;
        return new LimitedQueryable<T, U>(this.schema as any, this.parent, { queryable: this })
    }

    sort(expression: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector: expression, direction: QueryOrdering.Ascending });
        return new OrderedQueryable<T, U>(this.schema as any, this.parent, { queryable: this });
    }

    sortDescending(expression: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector: expression, direction: QueryOrdering.Descending });
        return new OrderedQueryable<T, U>(this.schema as any, this.parent, { queryable: this });
    }
}
