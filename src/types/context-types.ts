import { AdvancedDictionary } from '../common/AdvancedDictionary';
import { IPreviewChanges } from './common-types';
import { EntityAndTag, IDbSetApi } from './dbset-types';
import { IDbRecord, IDbRecordBase } from './entity-types';

export type OnChangeEvent = <T extends IDbRecordBase = IDbRecordBase>(getChanges: () => { adds: EntityAndTag<T>[], removes: EntityAndTag<T>[], updates: EntityAndTag<T>[] }) => Promise<void>
export type DataContextEventCallback<TDocumentType> = ({ DocumentType }: { DocumentType: TDocumentType }) => void;
export type DataContextEvent = 'entity-created' | 'entity-removed' | 'entity-updated';

export interface IDataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {

    /**
     * Persist changes to the underlying data store.  Returns number of documents modified
     * @returns {Promise<number>}
     */
    saveChanges(): Promise<number>;

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
    attach: AdvancedDictionary<TEntityBase>;
    removeById: string[]
}

export interface IPrivateContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> extends IDataContext<TDocumentType, TEntityBase> {
    _getApi: () => IDbSetApi<TDocumentType, TEntityBase>;
}