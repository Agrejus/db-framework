import { DeepPartial, NonNullEntity } from "@agrejus/db-framework-core";
import { EntityMap } from "../types";
import { SelectionQueryable } from "./SelectionQueryable";
import { ShapedQueryable } from "./ShapedQueryable";
import { QueryOrdering } from "./types";

export class OrderedQueryable<T extends {}> extends SelectionQueryable<T> {

    order(selector: EntityMap<T, T[keyof T]>) {
        this.ordering.push({ selector, direction: QueryOrdering.Ascending });
        return new OrderedQueryable<T>(this);
    }

    orderDescending(selector: EntityMap<T, T[keyof T]>) {
        this.ordering.push({ selector, direction: QueryOrdering.Descending });
        return new OrderedQueryable<T>(this);
    }

    map<R extends DeepPartial<Pick<T, keyof T>> | T[keyof T]>(expression: EntityMap<T, R>) {
        return new ShapedQueryable<R>(this as any);
    }
}