import { SelectionQueryable } from "./SelectionQueryable";

export class LimitedQueryable<T extends {}, U = void> extends SelectionQueryable<T> {

    skip(amount: number) {
        this.skipValue = amount;
        return new SelectionQueryable<T, U>(this.schema as any, this.parent, { queryable: this });
    }
}