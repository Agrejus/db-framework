import { DeepPartial } from "./common-types";
import { ITrackedChanges, ITrackedData } from "./context-types";
import { IDbRecord } from "./entity-types";
import { IBulkOperationsResponse } from "./plugin-types";

export interface IList<T> {
    get length(): number;
    all(): T[];
    put(...items: T[]): void;
    includes(key: keyof T): boolean;
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
    original: TEntity
}

export interface IDbSetChangeTracker<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends IChangeTrackerBase<TDocumentType, TEntity, TExclusions> {
    getTrackedData(): ITrackedData<TDocumentType, TEntity>;
    merge(from: TEntity, to: TEntity): TEntity;
    markDirty(...entities: TEntity[]): Promise<TEntity[]>;
    processChanges(entity: TEntity): ProcessedChangesResult<TDocumentType, TEntity>;
    detach(ids: (keyof TEntity)[]): void;
    attach(...data: TEntity[]): TEntity[];
    readonly enrichment: Enrichment<TDocumentType, TEntity, TExclusions>;
    isAttached(id: keyof TEntity): boolean;
    isLinked(entity: TEntity): boolean;
    link(foundEntities: TEntity[], attachEntities: TEntity[]): TEntity[];
}

export interface IChangeTrackerBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    enableChangeTracking(...entities: TEntity[]): TEntity[];
    getPendingChanges(): ITrackedChanges<TDocumentType, TEntity>;
    reinitialize(removals?: TEntity[], add?: TEntity[], updates?: TEntity[]): void;
    asUntracked(...entities: TEntity[]): TEntity[];
}

export interface IContextChangeTracker<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends IChangeTrackerBase<TDocumentType, TEntity, TExclusions> {
    registerChangeTracker(documentType: TDocumentType, tracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>): void;
    readonly enrichment: Enrichment<TDocumentType, TEntity, TExclusions>;

}

export type Enrichment<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> = {
    create: (entity: TEntity) => TEntity;
    upsert: (entity: TEntity) => TEntity;
    link: (entity: TEntity) => TEntity;
    retrieve: (entity: TEntity) => TEntity;
    deserialize: (entity: TEntity) => TEntity;
    serialize: (entity: TEntity) => TEntity;
    enhance: (entity: TEntity) => TEntity;
    prepare: (entity: TEntity) => TEntity;
    remove: (entity: TEntity) => TEntity;
    composers: {
        persisted: (generatedData: IBulkOperationsResponse) => (entity: TEntity) => TEntity;
    }
}

export type EnrichmentCreatorProps<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = {
    untrackedPropertyNames: Set<string>
    idPropertyName: keyof TEntity;
    changeTrackingId: string;
}