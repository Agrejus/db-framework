import { DeepPartial } from "./common-types";
import { ITrackedChanges, ITrackedData } from "./context-types";
import { PropertyMap } from "./dbset-builder-types";
import { DbSetMap } from "./dbset-types";
import { IDbRecord, OmittedEntity } from "./entity-types";

// export interface IChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
//     enableChangeTracking(entity: TEntity, defaults: DeepPartial<OmittedEntity<TEntity>>, readonly: boolean, maps: PropertyMap<TDocumentType, TEntity, any>[]): TEntity;
// }

export interface IAttachmentDictionary<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    get length(): number;
    all(): TEntity[];
    push(...items: TEntity[]): void;
    includes(key: keyof TEntity): boolean;
    get(id: keyof TEntity): TEntity | undefined;
    has(id: keyof TEntity): boolean;
    remove(...items: TEntity[]): void;
    removeById(...items: (keyof TEntity)[]): void;
    filter(predicate: (value: TEntity, index: number, array: TEntity[]) => boolean): TEntity[];
    concat(dictionary: IAttachmentDictionary<TDocumentType, TEntity>): IAttachmentDictionary<TDocumentType, TEntity>;
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

export interface IDbSetChangeTracker<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends IChangeTrackerBase<TDocumentType, TEntity, TExclusions> {
    getTrackedData(): ITrackedData<TDocumentType, TEntity>;
    merge(from: TEntity, to: TEntity): TEntity;
    markDirty(...entities: TEntity[]): Promise<TEntity[]>;
    isDirty(entity: TEntity): boolean;
    detach(ids: (keyof TEntity)[]): void;
    attach(data: TEntity[]): TEntity[];
    mapAndSetDefaults(entity: TEntity | OmittedEntity<TEntity, TExclusions>, maps: PropertyMap<any, any, any>[], defaults: DeepPartial<OmittedEntity<TEntity, TExclusions>>): TEntity | OmittedEntity<TEntity, TExclusions>;
    isAttached(id: keyof TEntity): boolean;
}

export interface IChangeTrackerBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    enableChangeTracking(entity: TEntity, defaults: DeepPartial<OmittedEntity<TEntity, TExclusions>>, readonly: boolean, maps: PropertyMap<TDocumentType, TEntity, any>[]): TEntity;
    getPendingChanges(): ITrackedChanges<TDocumentType, TEntity>;
    makePristine(...entities: TEntity[]): void;
    reinitialize(removals?: TEntity[], add?: TEntity[], updates?: TEntity[]): void;
    asUntracked(...entities: TEntity[]): TEntity[];
}

export interface IContextChangeTracker<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends IChangeTrackerBase<TDocumentType, TEntity, TExclusions> {
    registerChangeTracker(documentType: TDocumentType, tracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>): void;
}