import { SchemaCache, SchemaDataStore } from "../cache/SchemaDataStore";
import { DeepPartial } from "./common-types";
import { ITrackedChanges, ITrackedData } from "./context-types";
import { IDbRecord } from "./entity-types";
import { IBulkOperationsResponse } from "./plugin-types";

export interface IList<T> {
    get length(): number;
    all(): T[];
    put(...items: T[]): void;
    get(id: keyof T): T | undefined;
    has(id: keyof T): boolean;
    remove(...items: T[]): void;
    removeById(...items: (keyof T)[]): void;
    filter(predicate: (value: T, index: number, array: T[]) => boolean): T[];
    map<TResult>(predicate: (value: T, index: number, array: T[]) => TResult): TResult[];
    concat(dictionary: IList<T>): IList<T>;
}

export interface IChangeTrackingStore<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    removals: TEntity[];
    additions: TEntity[];
    removeById: string[];
    reinitialize(): void;
}

export interface IChangeTrackingStoreData<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    add: TEntity[];
    remove: TEntity[];
    removeById: string[]
}

export type ChangeTrackingStoreInstanceCreator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = new () => IChangeTrackingStore<TDocumentType, TEntity>;

export type ProcessedChangesResult<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = {
    isDirty: boolean,
    deltas: DeepPartial<TEntity> | null,
    doc: TEntity,
    original: TEntity,
    timestamp: number;
}

export interface IDbSetChangeTracker<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends IChangeTrackerBase<TDocumentType, TEntity, TExclusions> {
    getTrackedData(): ITrackedData<TDocumentType, TEntity>;
    merge(from: TEntity, to: TEntity): TEntity;
    markDirty(...entities: TEntity[]): Promise<TEntity[]>;
    processChanges(entity: TEntity): ProcessedChangesResult<TDocumentType, TEntity>;
    detach(ids: (keyof TEntity)[]): void;
    attach(...data: TEntity[]): TEntity[];
    readonly enrichment: IEnrichmentComposer<TDocumentType, TEntity, TExclusions>;
    isAttached(id: keyof TEntity): boolean;
    isLinked(entity: TEntity): boolean;
    link(foundEntities: TEntity[], attachEntities: TEntity[]): TEntity[];
}

export interface IChangeTrackerBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    getPendingChanges(): ITrackedChanges<TDocumentType, TEntity>;
    reinitialize(removals?: TEntity[], add?: TEntity[], updates?: TEntity[]): void;
    asUntracked(...entities: TEntity[]): TEntity[];
}

export interface IEnrichers<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    documentType: (entity: Readonly<TEntity>) => TEntity,
    id: (entity: Readonly<TEntity>) => TEntity,
    defaultAdd: (entity: Readonly<TEntity>) => TEntity,
    defaultRetrieve: (entity: Readonly<TEntity>) => TEntity,
    serialize: (entity: Readonly<TEntity>) => TEntity,
    deserialize: (entity: Readonly<TEntity>) => TEntity,
    enhance: (entity: TEntity) => TEntity,
    strip: (entity: Readonly<TEntity>) => TEntity
    remove: (entity: Readonly<TEntity>) => TEntity;
    changeTracking: (entity: Readonly<TEntity>) => TEntity;
}

export interface IComposeEnrichers<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    persisted(response: IBulkOperationsResponse): (entity: Readonly<TEntity>) => TEntity;
}

export type EnrichmentPick<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> = (keyof IEnrichers<TDocumentType, TEntity, TExclusions>) | ((entity: TEntity) => TEntity)

export type IEnrichmentComposer<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> = {
    compose(...enrichers: EnrichmentPick<TDocumentType, TEntity, TExclusions>[]): (entity: TEntity) => TEntity;
    composers: IComposeEnrichers<TDocumentType, TEntity, TExclusions>;
}

export type EnrichmentCreatorProps<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = {
    untrackedPropertyNames: Set<string>;
    schemaCache: SchemaDataStore<TDocumentType, TEntity, never>;
    idPropertyName: keyof TEntity;
    changeTrackingId: string;
}