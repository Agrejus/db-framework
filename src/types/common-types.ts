import { ReadOnlyList } from "../common/ReadOnlyList";
import { IEntityUpdates } from "./context-types";
import { IDbRecord, OmittedEntity, IRemovalRecord } from "./entity-types";

export type DeepOmit<T, K extends PropertyKey> = {
    [P in keyof T as P extends K ? never : P]: DeepOmit<T[P], K extends `${Exclude<P, symbol>}.${infer R}` ? R : never>
}

// https://medium.com/xgeeks/typescript-utility-keyof-nested-object-fa3e457ef2b2
export type DeepKeyOf<T> = {
    [Key in keyof T & (string | number)]: T[Key] extends object ? `${Key}` | `${Key}.${DeepKeyOf<T[Key]>}` : `${Key}`
}[keyof T & (string | number)];

export type DocumentKeySelector<T> = (entity: T) => any
export type KeyOf<T> = keyof T | DocumentKeySelector<T>;
export type IdKeys<T> = KeyOf<T>[];
export type IdKey<T> = KeyOf<T>;
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type DbSetActionDictionaryOptional<T> = DbSetActionDictionaryRequired<T> | { add: T } | { retrieve: T };
export type DbSetActionDictionaryRequired<T> = { add: T, retrieve: T };
export type DbSetPickDefaultActionOptional<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> = DbSetActionDictionaryOptional<DeepPartial<OmittedEntity<TEntity, TExclusions>>>;
export type DbSetPickDefaultActionRequired<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> = DbSetActionDictionaryRequired<DeepPartial<OmittedEntity<TEntity, TExclusions>>>;

export type GenericSelector<T> = (entity: T, index?: number, array?: T[]) => boolean;
export type EntitySelector<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entity: TEntity, index?: number, array?: TEntity[]) => boolean;
export type EntityComparator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (original: TEntity, next: TEntity) => DeepPartial<TEntity> | null;

export type DeepReadOnly<T> = { readonly [key in keyof T]: DeepReadOnly<T[key]> };

export interface Changes<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {
    adds: ReadOnlyList<TEntityBase>;
    removes: ReadOnlyList<IRemovalRecord<TDocumentType, TEntityBase>>;
    updates: IEntityUpdates<TDocumentType, TEntityBase>
}

export type ToUnion<T> = { [K in keyof T]: K }[keyof T]

export type IDictionary<T> = { [key: string | number]: T };
export type TagsCollection = { [entityId: string]: unknown; }

export type CacheType = "all" | "get";
export type MatchType = "missing" | "exact" | "queried";
export type EntityCache<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = {
    data: IDictionary<TEntity>;
    cache: {
        [cacheType in CacheType]: {
            [cacheKey: string]: IDictionary<TEntity>
        }
    }
}

export type TtlEntityCache<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = EntityCache<TDocumentType, TEntity> & {
    expirations: IDictionary<number>
}

