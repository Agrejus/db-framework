import { IDbRecord, IDbRecordBase, OmittedEntity } from './entity-types';
import { DbSetCacheConfiguration, DbSetSubscriptionCallback, DbSetTtlCacheConfiguration, IDbSetInfo } from './dbset-types';
import { EntitySelector } from './common-types';
import { SearchResult } from '../common/SearchResult';

export interface IDbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {
    useCache(configuration: DbSetCacheConfiguration | DbSetTtlCacheConfiguration): void;
    clearCache(...keys: string[]): void;
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<SearchResult<TDocumentType, TEntity, TExclusions>>;
    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<SearchResult<TDocumentType, TEntity, TExclusions> | undefined>;
    all(): Promise<SearchResult<TDocumentType, TEntity, TExclusions>>;
    get(...ids: string[]): Promise<SearchResult<TDocumentType, TEntity, TExclusions>>;
    getStrict(...ids: string[]): Promise<SearchResult<TDocumentType, TEntity, TExclusions>>;
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
    hasSubscriptions(): boolean;
    tag(value: unknown): void;
    subscribe(selectorOrCallback: EntitySelector<TDocumentType, TEntity> | DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>, callback?: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>): () => void;
}


export interface IDbSetCacheAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {
    resolve(fetch: () => Promise<TEntity[]>, cacheOptions: DbSetCacheConfiguration | DbSetTtlCacheConfiguration, ...ids: string[]): Promise<TEntity[]>
    clear(...keys: string[]): void;
}