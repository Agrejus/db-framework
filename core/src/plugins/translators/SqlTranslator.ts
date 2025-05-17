import { DataTranslator } from "./DataTranslator";

export class SqlTranslator<TEntity extends {}, TShape> extends DataTranslator<TEntity, TShape> {

    // data should be the result we are looking for 
    count<T extends number>(data: unknown): T {
        return data as T;
    }

    min<T extends string | number | Date>(data: unknown): T {
        return data as T;
    }

    max<T extends string | number | Date>(data: unknown): T {
        return data as T;
    }

    sum<T extends number>(data: unknown): T {
        return data as T;
    }

    distinct<T>(data: unknown): T {
        return data as T;
    }

    default<T>(data: unknown): T {
        return data as T
    }

    skip<T>(data: unknown): T {
        return data as T
    }

    take<T>(data: unknown): T {
        return data as T
    }

    sort<T>(data: unknown): T {
        return data as T
    }

    map<T>(data: unknown): T {
        return data as T
    }
}