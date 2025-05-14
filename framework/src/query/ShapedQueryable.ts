import { EntityMap, QueryResult } from "../types";
import { AggregateQueryable } from "./AggregateQueryable";
import { LimitedQueryable } from "./LimitedQueryable";
import { OrderedQueryable } from "./OrderedQueryable";
import { SelectionQueryable } from "./SelectionQueryable";
import { SkippedQueryable } from "./SkippedQueryable";
import { QueryOrdering } from "./types";

export class ShapedQueryable<T extends {}, U = void> extends SelectionQueryable<T> {

    skip(amount: number) {
        this.skipValue = amount;
        return new SkippedQueryable<T, U>({ queryable: this });
    }

    take(amount: number) {
        this.takeValue = amount;
        return new LimitedQueryable<T, U>({ queryable: this })
    }

    order(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Ascending });
        return new OrderedQueryable<T, U>({ queryable: this });
    }

    orderDescending(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Descending });
        return new OrderedQueryable<T, U>({ queryable: this });
    }
}
