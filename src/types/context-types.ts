import { IAttachmentDictionary } from './change-tracking-types';
import { DeepPartial, IPreviewChanges } from './common-types';
import { IDbSetApi, SaveChangesEventData } from './dbset-types';
import { IDbRecord, IdRemoval } from './entity-types';

export type OnChangeEvent<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> = (getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>) => Promise<void>

export interface IDataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {

    /**
     * Persist changes to the underlying data store.  Returns number of documents modified
     * @returns {Promise<number>}
     */
    saveChanges(): Promise<{
        changes: {
            add: TEntityBase[];
            remove: TEntityBase[];
            updated: IEntityUpdates<TDocumentType, TEntityBase>;
        },
        successes_count: number
    }>;

    /**
     * Get all documents in the underlying data store
     * @returns {Promise<TEntityBase[]>}
     */
    getAllDocs(): Promise<TEntityBase[]>;

    /**
     * Check to see if there are any unsaved changes
     * @returns {boolean}
     */
    hasPendingChanges(): boolean;

    /**
     * Remove all entities from all DbSets in the data context, saveChanges must be called to persist these changes to the store
     * @returns {Promise<void>}
     */
    empty(): Promise<void>;

    /**
     * Destroy Pouch Database
     * @returns {Promise<void>}
     */
    destroyDatabase(): Promise<void>;

    /**
     * Will list changes that will be persisted.  Changes are add, remove, update.  NOTE:  This is a copy of the changes, changes made will not be persisted
     * @returns {Promise<IPreviewChanges<TDocumentType, TEntityBase>>}
     */
    previewChanges(): Promise<IPreviewChanges<TDocumentType, TEntityBase>>
}

export interface ITrackedData<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {
    add: TEntityBase[];
    remove: TEntityBase[];
    attach: IAttachmentDictionary<TDocumentType, TEntityBase>;
    removeById: IdRemoval<TDocumentType>[]
}

export type IEntityUpdates<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> = {
    docs: { [key: string | number]: TEntityBase; };
    deltas: { [key: string | number]: DeepPartial<TEntityBase>; };
    originals: TEntityBase[];
}

export interface ITrackedChanges<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {
    add: TEntityBase[];
    remove: TEntityBase[];
    removeById: IdRemoval<TDocumentType>[];
    updated: IEntityUpdates<TDocumentType, TEntityBase>;
}

export interface IPrivateContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase> extends IDataContext<TDocumentType, TEntityBase> {
    _getApi: () => IDbSetApi<TDocumentType, TEntityBase, TExclusions>;
}

export type DbFrameworkEnvironment = "development" | "production"

export type ContextOptions = {
    environment?: DbFrameworkEnvironment
}