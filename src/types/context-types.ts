import { ReadOnlyList } from '../common/ReadOnlyList';
import { Transactions } from '../common/Transactions';
import { IList } from './change-tracking-types';
import { DeepPartial, Changes, SaveResult, IDictionary } from './common-types';
import { IDbSetApi, SaveChangesEventData } from './dbset-types';
import { IDbRecord, IdRemoval } from './entity-types';

export type OnChangeEvent<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> = (getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>) => Promise<void>

export interface IDataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {

    /**
     * Persist changes to the underlying data store.  Returns number of documents modified
     * @returns {Promise<number>}
     */
    saveChanges(): Promise<SaveResult<TDocumentType, TEntityBase>>;

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
     * @returns {Promise<Changes<TDocumentType, TEntityBase>>}
     */
    previewChanges(): Promise<Changes<TDocumentType, TEntityBase>>
}

export interface ITrackedData<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {
    adds: TEntityBase[];
    removes: TEntityBase[];
    attachments: IList<TEntityBase>;
    removesById: IdRemoval<TDocumentType>[];
    transactions: Transactions;
}

export type IEntityUpdates<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> = {
    docs: ReadOnlyList<TEntityBase>;
    deltas: ReadOnlyList<DeepPartial<TEntityBase>>;
    originals: ReadOnlyList<TEntityBase>;
}

export interface IProcessedUpdates<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {
    docs: IDictionary<TEntityBase>;
    deltas: IDictionary<DeepPartial<TEntityBase>>;
    originals: IDictionary<TEntityBase>;
    timestamp: { [id: string | number]: number };
}

export interface ITrackedChanges<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {
    adds: TEntityBase[];
    removes: TEntityBase[];
    removesById: IdRemoval<TDocumentType>[];
    updates: IProcessedUpdates<TDocumentType, TEntityBase>;
    transactions: Transactions;
}

export interface IPrivateContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase> extends IDataContext<TDocumentType, TEntityBase> {
    _getApi: () => IDbSetApi<TDocumentType, TEntityBase, TExclusions>;
}

export type DbFrameworkEnvironment = "development" | "production"

export type ContextOptions = {
    environment?: DbFrameworkEnvironment
}