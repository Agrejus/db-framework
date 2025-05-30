import { SelectionQueryable } from "./SelectionQueryable";

export class SkippedQueryable<T extends {}, U = void> extends SelectionQueryable<T> {

    take(amount: number) {
        this.takeValue = amount;
        return new SelectionQueryable<T, U>(this.schema as any, this.parent, { queryable: this })
    }
}
