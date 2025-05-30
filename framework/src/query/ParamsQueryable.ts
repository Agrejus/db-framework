import { ParamsFilter } from "@agrejus/db-framework-core";
import { QueryableBase } from "./base/QueryableBase";

export class ParamsQueryable<T extends {}, U = void> extends QueryableBase<T> {

    where<P extends {}>(expression: ParamsFilter<T, P>, params: P) {
        this.filters.push({ params, filter: expression });
        return new ParamsQueryable<T, U>(this.schema as any, this.parent, { queryable: this });
    }

}
