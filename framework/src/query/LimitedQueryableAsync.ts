import { SelectionQueryableAsync } from "./SelectionQueryableAsync";

export class LimitedQueryableAsync<T extends {}> extends SelectionQueryableAsync<T> {

    skip(amount: number) {
        this.skipValue = amount;
        return new SelectionQueryableAsync<T>(this.schema as any, this.parent, { queryable: this });
    }
}