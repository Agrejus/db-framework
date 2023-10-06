import { IDbRecord, IDbRecordBase, OmittedEntity } from './entity-types';
import { IDbSetInfo } from './dbset-types';

export interface IDbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>;
    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity | undefined>;
    first(): Promise<TEntity | undefined>;
    all(): Promise<TEntity[]>;
    get(...ids: string[]): Promise<TEntity[]>;
}

export interface IDbSetGeneralAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {
    isMatch(first: TEntity, second: any): boolean;
    match(...entities: IDbRecordBase[]): TEntity[];
    info(): IDbSetInfo<TDocumentType, TEntity, TExclusions>;
    merge(from: TEntity, to: TEntity): TEntity;
    unlink(...entities: TEntity[]): void;
    link(...entites: TEntity[]): Promise<TEntity[]>;
    markDirty(...entities: TEntity[]): Promise<TEntity[]>;
}

export interface IDbSetModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {
    instance(...entities: OmittedEntity<TEntity, TExclusions>[]): TEntity[];
    add(...entities: OmittedEntity<TEntity, TExclusions>[]): Promise<TEntity[]>;
    upsert(...entities: (OmittedEntity<TEntity, TExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>;
    remove(...ids: string[]): Promise<void>;
    remove(...entities: TEntity[]): Promise<void>;
    empty(): Promise<void>;
    tag(value: unknown): void;
}
