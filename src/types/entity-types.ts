import { DeepOmit, IdKey, PouchDbReference } from "./common-types";

export type OmittedEntity<TEntity, TExtraExclusions extends string = never> = DeepOmit<TEntity, "_id" | "_rev" | "DocumentType" | TExtraExclusions>;

export type IDbRecord<TDocumentType extends string> = {
    readonly _id: string;
    readonly _rev: string;
} & IDbAdditionRecord<TDocumentType>


export const SplitDocumentPathPropertyName = "referencePath";
export const SplitDocumentDocumentPropertyName = "reference";
export interface ISplitDbRecord<TDocumentType extends string, TReferenceDocumentType extends string, TReferenceEntity extends IDbRecord<TReferenceDocumentType>> extends IDbRecord<TDocumentType> {
    referencePath: PouchDbReference;
    reference: TReferenceEntity;
}

export interface IUnmanagedSplitDbRecord<TDocumentType extends string, TReferenceDocumentType extends string, TReferenceEntity extends IDbRecord<TReferenceDocumentType>> extends IDbRecord<TDocumentType> {
    referencePath?: PouchDbReference;
    reference?: TReferenceEntity;
}

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

export interface ICacheDocumentBase {
    _id: string
}

export interface ICachedDatabases extends ICacheDocumentBase {
    list: string[];
}