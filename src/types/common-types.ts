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
export type DbSetPickDefaultActionOptional<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = DbSetActionDictionaryOptional<DeepPartial<OmittedEntity<TEntity>>>;
export type DbSetPickDefaultActionRequired<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = DbSetActionDictionaryRequired<DeepPartial<OmittedEntity<TEntity>>>;

export type EntitySelector<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entity: TEntity, index?: number, array?: TEntity[]) => boolean

export interface IBulkDocsResponse {
    ok: boolean;
    id: string;
    rev: string;
    error?: string;
}

export type DeepReadOnly<T> = { readonly [key in keyof T]: DeepReadOnly<T[key]> };

export interface IPreviewChanges<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {
    add: TEntityBase[];
    remove: IRemovalRecord<TDocumentType, TEntityBase>[];
    update: TEntityBase[];
}