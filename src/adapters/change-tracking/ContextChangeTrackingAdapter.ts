import { IDbSetChangeTracker, IContextChangeTracker } from "../../types/change-tracking-types";
import { DeepPartial, DeepOmit } from "../../types/common-types";
import { ITrackedData, ITrackedChanges } from "../../types/context-types";
import { PropertyMap } from "../../types/dbset-builder-types";
import { DbSetMap } from "../../types/dbset-types";
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

    getPendingChanges(): ITrackedChanges<TDocumentType, TEntity> {

        return Object.values(this._changeTrackers).reduce((a, v, i) => {
            const trackedData = v.getPendingChanges();

            if (i === 0) {
                return trackedData;
            }

            a.add = a.add.concat(trackedData.add);
            a.updated = a.updated.concat(trackedData.updated);
            a.removeById = a.removeById.concat(trackedData.removeById);
            a.remove = a.remove.concat(trackedData.remove);

            return a;
        }, {} as ITrackedChanges<TDocumentType, TEntity>)
    }

    makePristine(...entities: TEntity[]) {
        for (const item of entities) {
            this._changeTrackers[item.DocumentType].makePristine(item);
        }
    }

    reinitialize(removals?: TEntity[], add?: TEntity[], updates?: TEntity[]) {

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