import { QueryRoot } from "./base/QueryRoot";
import { SelectionQueryable } from "./SelectionQueryable";

export class LimitedQueryable<T extends {}> extends SelectionQueryable<T> {

    skip(amount: number) {
        this.skipValue = amount;
        return new SelectionQueryable<T>(this);
    }
}