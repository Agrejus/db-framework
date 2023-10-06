import { DeepOmit, IdKey } from "./common-types";

export type OmittedEntity<TEntity, TExclusions extends keyof TEntity = never> = DeepOmit<TEntity, "DocumentType" | TExclusions>;

export type IDbRecord<TDocumentType extends string> = {
    readonly DocumentType: TDocumentType;
}

export type IDbRecordBase = IDbRecord<any>

export type IRemovalRecord<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> = TEntityBase & { _deleted: boolean };

export interface IIndexableEntity<T extends any = any> {
    [key: string]: T;
}

export type EntityIdKeys<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> = EntityIdKey<TDocumentType, TEntity, TExclusions>[];
export type EntityIdKey<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> = IdKey<Omit<TEntity, "DocumentType" | TExclusions>>;