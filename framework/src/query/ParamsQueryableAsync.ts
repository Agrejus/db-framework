import { ParamsFilter } from "../types";
import { QueryableBaseAsync } from "./base/QueryableBaseAsync";

export class ParamsQueryableAsync<T extends {}> extends QueryableBaseAsync<T> {

    where<P extends {}>(expression: ParamsFilter<T, P>, params: P) {
        this.paramsQueries.push({ params, expression });
        return new ParamsQueryableAsync<T>(this);
    }

}
