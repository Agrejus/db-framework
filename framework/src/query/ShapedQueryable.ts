import { EntityMap } from "../types";
import { LimitedQueryable } from "./LimitedQueryable";
import { OrderedQueryable } from "./OrderedQueryable";
import { SelectionQueryable } from "./SelectionQueryable";
import { SkippedQueryable } from "./SkippedQueryable";
import { QueryOrdering } from "./types";

export class ShapedQueryable<T extends {}, U = void> extends SelectionQueryable<T> {

    skip(amount: number) {
        this.skipValue = amount;
        return new SkippedQueryable<T, U>(this.schema as any, this.parent, { queryable: this });
    }

    take(amount: number) {
        this.takeValue = amount;
        return new LimitedQueryable<T, U>(this.schema as any, this.parent, { queryable: this })
    }

    sort(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Ascending });
        return new OrderedQueryable<T, U>(this.schema as any, this.parent, { queryable: this });
    }

    sortDescending(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Descending });
        return new OrderedQueryable<T, U>(this.schema as any, this.parent, { queryable: this });
    }
}
