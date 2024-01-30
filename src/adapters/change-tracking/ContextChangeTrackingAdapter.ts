import { IDbSetChangeTracker, IContextChangeTracker, Enrichment } from "../../types/change-tracking-types";
import { ITrackedChanges } from "../../types/context-types";
import { IDbRecord } from "../../types/entity-types";
import { IBulkOperationsResponse } from "../../types/plugin-types";

/**
 * Uses hashing to track changes at the context level.  Useful for applications that have trouble with proxy objects
 */
export class ContextChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> implements IContextChangeTracker<TDocumentType, TEntity, TExclusions> {

    private readonly _changeTrackers: { [key: string]: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> } = {};

    readonly enrichment: Enrichment<TDocumentType, TEntity, TExclusions> = {
        add: (entity: TEntity) => this._changeTrackers[entity.DocumentType].enrichment.add(entity),
        retrieve: (entity: TEntity) => this._changeTrackers[entity.DocumentType].enrichment.retrieve(entity),
        enhance: (entity: TEntity) => this._changeTrackers[entity.DocumentType].enrichment.enhance(entity),
        map: (entity: TEntity) => this._changeTrackers[entity.DocumentType].enrichment.map(entity),
        upsert: (entity: TEntity) => this._changeTrackers[entity.DocumentType].enrichment.upsert(entity),
        strip: (entity: TEntity) => this._changeTrackers[entity.DocumentType].enrichment.strip(entity),
        remove: (entity: TEntity) => this._changeTrackers[entity.DocumentType].enrichment.remove(entity),
        composers: {
            persisted: (generatedData: IBulkOperationsResponse) => (entity: TEntity) => this._changeTrackers[entity.DocumentType].enrichment.composers.persisted(generatedData)(entity),
        }
    }

    registerChangeTracker(documentType: TDocumentType, tracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        this._changeTrackers[documentType] = tracker;
    }

    enableChangeTracking(entity: TEntity): TEntity {
        return this._changeTrackers[entity.DocumentType].enableChangeTracking(entity);
    }

    getPendingChanges() {
        const trackedChanges = Object.values(this._changeTrackers).reduce((a, v, i) => {
            const trackedData = v.getPendingChanges();

            if (i === 0) {
                return trackedData;
            }

            a.add = a.add.concat(trackedData.add);
            a.updated = {
                deltas: { ...trackedData.updated.deltas, ...a.updated.deltas },
                docs: { ...trackedData.updated.docs, ...a.updated.docs },
                originals: { ...trackedData.updated.originals, ...a.updated.originals }
            };
            a.removeById = a.removeById.concat(trackedData.removeById);
            a.remove = a.remove.concat(trackedData.remove);

            return a;
        }, {} as ITrackedChanges<TDocumentType, TEntity>);

        return trackedChanges;
    }

    private _toDictionary(data?: TEntity[]) {

        return (data ?? []).reduce((a, v) => {
            if (a[v.DocumentType] == null) {
                a[v.DocumentType] = [];
            }

            a[v.DocumentType].push(v);

            return a;
        }, {} as { [key: string]: TEntity[] });
    }

    reinitialize(removals?: TEntity[], add?: TEntity[], updates?: TEntity[]) {
        const removalDictionary = this._toDictionary(removals);
        const addDictionary = this._toDictionary(add);
        const updateDictionary = this._toDictionary(updates);

        const removalDictionaryDocumentTypes = Object.keys(removalDictionary);
        const addDictionaryDocumentTypes = Object.keys(addDictionary);
        const updateDictionaryDocumentTypes = Object.keys(updateDictionary);

        const documentTypes = [
            ...removalDictionaryDocumentTypes,
            ...addDictionaryDocumentTypes,
            ...updateDictionaryDocumentTypes
        ].reduce((a, v) => ({ ...a, [v]: v }), {} as { [key: string]: string });

        for (const documentType in documentTypes) {
            const removalsByDocumentType = removalDictionary[documentType];
            const addByDocumentType = addDictionary[documentType];
            const updatesByDocumentType = updateDictionary[documentType];

            this._changeTrackers[documentType].reinitialize(removalsByDocumentType, addByDocumentType, updatesByDocumentType)
        }

    }

    asUntracked(...entities: TEntity[]) {
        const result: TEntity[] = [];

        // we want to keep the same ordering
        for (const item of entities) {
            const [response] = this._changeTrackers[item.DocumentType].asUntracked(item);
            result.push(response);
        }

        return result;
    }
}