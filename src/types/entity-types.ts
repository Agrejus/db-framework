import { DeepOmit, IdKey } from "./common-types";

export type OmittedEntity<TEntity, TExtraExclusions extends string = never> = DeepOmit<TEntity, "_id" | "_rev" | "DocumentType" | TExtraExclusions>;

export type IDbRecord<TDocumentType extends string> = {
    readonly _id: string;
    readonly _rev: string;
} & IDbAdditionRecord<TDocumentType>

export type IDbAdditionRecord<TDocumentType extends string> = {
    readonly DocumentType: TDocumentType;
}

export type IDbRecordBase = IDbRecord<any>

export type IRemovalRecord<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> = TEntityBase & { _deleted: boolean };

export interface IIndexableEntity<T extends any = any> {
    [key: string]: T;
}

export type EntityIdKeys<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = EntityIdKey<TDocumentType, TEntity>[];
export type EntityIdKey<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = IdKey<Omit<TEntity, "_id" | "_rev" | "DocumentType">>;