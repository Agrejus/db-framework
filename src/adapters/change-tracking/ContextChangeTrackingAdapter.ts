import { IDbSetChangeTracker, IContextChangeTracker } from "../../types/change-tracking-types";
import { DeepPartial, DeepOmit } from "../../types/common-types";
import { ITrackedChanges } from "../../types/context-types";
import { PropertyMap } from "../../types/dbset-builder-types";
import { IDbRecord } from "../../types/entity-types";

/**
 * Uses hashing to track changes at the context level.  Useful for applications that have trouble with proxy objects
 */
export class ContextChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> implements IContextChangeTracker<TDocumentType, TEntity, TExclusions> {

    private readonly _changeTrackers: { [key: string]: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> } = {};

    registerChangeTracker(documentType: TDocumentType, tracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        this._changeTrackers[documentType] = tracker;
    }

    enableChangeTracking(entity: TEntity, defaults: DeepPartial<DeepOmit<TEntity, TExclusions | "DocumentType">>, readonly: boolean, maps: PropertyMap<TDocumentType, TEntity, any>[]): TEntity {
        return this._changeTrackers[entity.DocumentType].enableChangeTracking(entity, defaults, readonly, maps);
    }

    getPendingChanges() {
        const trackedChanges = Object.values(this._changeTrackers).reduce((a, v, i) => {
            const trackedData = v.getPendingChanges();

            if (i === 0) {
                return trackedData;
            }

            a.add = a.add.concat(trackedData.add);
            a.updated = a.updated.concat(trackedData.updated);
            a.removeById = a.removeById.concat(trackedData.removeById);
            a.remove = a.remove.concat(trackedData.remove);

            return a;
        }, {} as ITrackedChanges<TDocumentType, TEntity>);

        return trackedChanges;
    }

    makePristine(...entities: TEntity[]) {
        for (const item of entities) {
            this._changeTrackers[item.DocumentType].makePristine(item);
        }
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

        for(const documentType in documentTypes) {
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