import { Filter, ParamsFilter } from "../types";
import { QueryableBase } from "./base/QueryableBase";
import { ParamsQueryable } from "./ParamsQueryable";

export class Queryable<T extends {}, U = void> extends QueryableBase<T, U> {

    where(expression: Filter<T>): Queryable<T>;
    where<P extends {}>(selector: ParamsFilter<T, P>, params: P): ParamsQueryable<T>;
    where<P extends {} = never>(selector: ParamsFilter<T, P> | Filter<T>, params?: P) {
        if (params == null) {
            this.queries.push(selector as Filter<T>);
            return new Queryable<T, U>(this);
        }

        this.paramsQueries.push({ expression: selector as ParamsFilter<T, P>, params });

        return new ParamsQueryable<T, U>(this);
    }

    subscribe() {
        this.subscribeValue = true;
        return new Queryable<T, () => void>(this);
    }
}


