import { IDbRecord, IDbRecordBase, OmittedEntity } from './entity-types';
import { DbSetCacheConfiguration, IDbSetInfo } from './dbset-types';
import { EntitySelector } from './common-types';
import { SearchResult } from '../common/SearchResult';

export interface IDbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<SearchResult<TDocumentType, TEntity, TExclusions>>;
    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<SearchResult<TDocumentType, TEntity, TExclusions>>;
    all(): Promise<SearchResult<TDocumentType, TEntity, TExclusions>>;
    get(...ids: string[]): Promise<SearchResult<TDocumentType, TEntity, TExclusions>>;
}

export interface IDbSetFetchMediator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {
    useCache(configuration: DbSetCacheConfiguration): void;
    clearCache(...keys: string[]): void;
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>;
    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity | undefined>;
    first(): Promise<TEntity | undefined>;
    all(): Promise<TEntity[]>;
    get(...ids: string[]): Promise<TEntity[]>;
    pluck<TKey extends keyof TEntity>(selector: EntitySelector<TDocumentType, TEntity>, propertySelector: TKey): Promise<TEntity[TKey]>
}

export interface IDbSetGeneralAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {
    isMatch(first: TEntity, second: any): boolean;
    match(...entities: IDbRecordBase[]): TEntity[];
    info(): IDbSetInfo<TDocumentType, TEntity, TExclusions>;
    merge(from: TEntity, to: TEntity): TEntity;
    unlink(...ids: (keyof TEntity)[]): void;
    unlink(...entities: TEntity[]): void;
    link(...entites: TEntity[]): Promise<TEntity[]>;
    linkUnsafe(...entites: TEntity[]): TEntity[];
    isLinked(entity: TEntity): boolean;
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
