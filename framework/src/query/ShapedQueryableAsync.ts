import { EntityMap } from "../types";
import { LimitedQueryableAsync } from "./LimitedQueryableAsync";
import { OrderedQueryableAsync } from "./OrderedQueryableAsync";
import { SelectionQueryableAsync } from "./SelectionQueryableAsync";
import { SkippedQueryableAsync } from "./SkippedQueryableAsync";
import { QueryOrdering } from "./types";

export class ShapedQueryableAsync<T extends {}> extends SelectionQueryableAsync<T> {

    skip(amount: number) {
        this.skipValue = amount;
        return new SkippedQueryableAsync<T>({ queryable: this });
    }

    take(amount: number) {
        this.takeValue = amount;
        return new LimitedQueryableAsync<T>({ queryable: this })
    }

    sort(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Ascending });
        return new OrderedQueryableAsync<T>({ queryable: this });
    }

    sortDescending(selector: EntityMap<T, T[keyof T]>) {
        this.sorting.push({ selector, direction: QueryOrdering.Descending });
        return new OrderedQueryableAsync<T>({ queryable: this });
    }
}
