import { SelectionQueryable } from "./SelectionQueryable";

export class SkippedQueryable<T extends {}> extends SelectionQueryable<T> {

    take(amount: number) {
        this.takeValue = amount;
        return new SelectionQueryable<T>(this)
    }
}
