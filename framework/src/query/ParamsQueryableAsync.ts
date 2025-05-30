import { ParamsFilter } from "@agrejus/db-framework-core";
import { QueryableBaseAsync } from "./base/QueryableBaseAsync";

export class ParamsQueryableAsync<T extends {}> extends QueryableBaseAsync<T> {

    where<P extends {}>(expression: ParamsFilter<T, P>, params: P) {
        this.filters.push({ params, filter: expression });
        return new ParamsQueryableAsync<T>(this.schema as any, this.parent, { queryable: this });
    }

}
