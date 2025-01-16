import { Filter, ParamsFilter } from "@agrejus/db-framework-core";
import { QueryableBase } from "./base/QueryableBase";
import { ParamsQueryable } from "./ParamsQueryable";

export class Queryable<T extends {}, U = void> extends QueryableBase<T, U> {

    where(expression: Filter<T>): Queryable<T, U>;
    where<P extends {}>(selector: ParamsFilter<T, P>, params: P): ParamsQueryable<T, U>;
    where<P extends {} = never>(selector: ParamsFilter<T, P> | Filter<T>, params?: P) {
        if (params == null) {
            this.filters.push({ filter: selector as Filter<T> });
            return new Queryable<T, U>(this);
        }

        this.filters.push({ params, filter: selector as ParamsFilter<T, P> });

        return new ParamsQueryable<T, U>(this);
    }

    subscribe() {
        this.subscribeValue = true;
        return new Queryable<T, () => void>(this);
    }
}


