import { IDbSetChangeTracker, EnrichmentPick } from "../../types/change-tracking-types";
import { ITrackedChanges } from "../../types/context-types";
import { IDbRecord } from "../../types/entity-types";
import { IBulkOperationsResponse } from "../../types/plugin-types";

/**
 * Uses hashing to track changes at the context level.  Useful for applications that have trouble with proxy objects
 */
export class ContextChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    private readonly _changeTrackers: { [key: string]: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> } = {};

    composeAndRunEnrichment(entities: TEntity[], ...enrichers: EnrichmentPick<TDocumentType, TEntity, TExclusions>[]) {

        const grouped = entities.reduce((a, v) => {

            if (a[v.DocumentType] == null) {
                a[v.DocumentType] = [];
            }
            a[v.DocumentType].push(v)

            return a;
        }, {} as { [key: string]: TEntity[] });
        const composed = Object.keys(grouped).reduce((a, v) => ({ ...a, [v]: this._changeTrackers[v].enrichment.compose(...enrichers) }), {} as { [key: string]: (entity: TEntity) => TEntity });

        return Object.keys(grouped).reduce((a, v) => {
            const enricher = composed[v];
            const entities = grouped[v];

            a.push(...entities.map(enricher));

            return a;
        }, [] as TEntity[]);
    }

    composeAndRunEnrichmentAfterPersisted(entities: TEntity[], modificationResult: IBulkOperationsResponse) {

        const grouped = entities.reduce((a, v) => {

            if (a[v.DocumentType] == null) {
                a[v.DocumentType] = [];
            }
            a[v.DocumentType].push(v)

            return a;
        }, {} as { [key: string]: TEntity[] });

        return Object.keys(grouped).reduce((a, v) => {

            const persisted = this._changeTrackers[v].enrichment.composers.persisted(modificationResult);
            const enricher = this._changeTrackers[v].enrichment.compose(persisted, "deserialize", "changeTracking", "enhance");
            const entities = grouped[v];

            a.push(...entities.map(enricher));

            return a;

            return a;
        }, [] as TEntity[]);
    }

    registerChangeTracker(documentType: TDocumentType, tracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        this._changeTrackers[documentType] = tracker;
    }

    getPendingChanges() {
        const trackedChanges = Object.values(this._changeTrackers).reduce((a, v, i) => {
            const trackedData = v.getPendingChanges();

            if (i === 0) {
                return trackedData;
            }

            a.adds = a.adds.concat(trackedData.adds);
            a.updates = {
                deltas: { ...trackedData.updates.deltas, ...a.updates.deltas },
                docs: { ...trackedData.updates.docs, ...a.updates.docs },
                originals: { ...trackedData.updates.originals, ...a.updates.originals },
                timestamp: { ...trackedData.updates.timestamp, ...a.updates.timestamp },
            };
            a.removesById = a.removesById.concat(trackedData.removesById);
            a.removes = a.removes.concat(trackedData.removes);
            a.transactions = a.transactions.concat(trackedData.transactions);

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