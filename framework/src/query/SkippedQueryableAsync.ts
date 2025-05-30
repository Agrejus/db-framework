
import { SelectionQueryableAsync } from "./SelectionQueryableAsync";

export class SkippedQueryableAsync<T extends {}> extends SelectionQueryableAsync<T> {

    take(amount: number) {
        this.takeValue = amount;
        return new SelectionQueryableAsync<T>(this.schema as any, this.parent, { queryable: this })
    }
}
