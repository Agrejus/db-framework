import { ParamsFilter } from "../types";
import { QueryableBase } from "./base/QueryableBase";

export class ParamsQueryable<T extends {}> extends QueryableBase<T> {

    where<P extends {}>(expression: ParamsFilter<T, P>, params: P) {
        this.paramsQueries.push({ params, expression });
        return new ParamsQueryable<T>(this);
    }

}
