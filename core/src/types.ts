import { NonNullCreateEntity, NonNullEntity } from "./schema";

export type IdType = string | number;
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type EntityChanges<T extends {}> = {
    adds: NonNullCreateEntity<T>[];
    removes: {
        entities: NonNullEntity<T>[];
        ids: [IdType][]
    };
    updates: {
        data: NonNullEntity<T>[];
        deltas: Map<IdType, NonNullEntity<T>>;
    };
}

export type EntityModificationResult<T extends {}> = {
    adds: NonNullEntity<T>[];
    removedCount: number;
    updates: NonNullEntity<T>[];
}

export type DefaultValue<T> = T | (() => T);
export type FunctionBody<TEntity, TResult> = (entity: TEntity, tableName: string) => TResult;