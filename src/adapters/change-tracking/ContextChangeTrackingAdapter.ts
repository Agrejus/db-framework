import { AdvancedDictionary } from "../../common/AdvancedDictionary";
import { DeepPartial, DeepOmit } from "../../types/common-types";
import { ITrackedData, ITrackedChanges } from "../../types/context-types";
import { PropertyMap } from "../../types/dbset-builder-types";
import { DbSetMap } from "../../types/dbset-types";
import { IDbRecord } from "../../types/entity-types";
import { ChangeTrackingAdapterBase } from "./ChangeTrackingAdapterBase";
import hash from 'object-hash';

/**
 * Uses hashing to track changes at the context level.  Useful for applications that have trouble with proxy objects
 */
export class ContextChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> extends ChangeTrackingAdapterBase<TDocumentType, TEntity> {

    protected originalAttachmentHashes: { [key: string]: string } = {};
    protected override attachments = new AdvancedDictionary<TDocumentType, TEntity>("_id");

    asUntracked(...entities: TEntity[]) {
        return entities;
    }

    isDirty(entity: TEntity) {

        if (this.originalAttachmentHashes[entity._id] == null) {
            return false
        }

        const hashCode = this._generateHashCode(entity);

        return this.originalAttachmentHashes[entity._id] != hashCode;
    }

    makePristine(...entities: TEntity[]) {
        // no op
    }

    override reinitialize(removals?: TEntity[], add?: TEntity[]): void {
        super.reinitialize(removals, add);
        this.originalAttachmentHashes = {};

        const adds = add ?? [];

        for (const item of adds) {
            const hashCode = this._generateHashCode(item);
            this.originalAttachmentHashes[item._id] = hashCode;
        }
    }

    override attach(data: TEntity[]): void {

        super.attach(data);

        for (const item of data) {
            const hashCode = this._generateHashCode(item);
            this.originalAttachmentHashes[item._id] = hashCode;
        }
    }

    getPendingChanges(changes: ITrackedData<TDocumentType, TEntity>, dbsets: DbSetMap): ITrackedChanges<TDocumentType, TEntity> {

        const { add, remove, removeById, attach } = changes;

        const deduplicatedUpdates = attach.filter(w => this.isDirty(w) === true).map(w => this.mapInstance(w, dbsets[w.DocumentType].info().Map)).reduce((a, v) => ({...a, [v._id]: v}), {} as { [key: string]: TEntity });
        const updated = Object.values<TEntity>(deduplicatedUpdates);

        return {
            add,
            remove,
            removeById,
            updated
        }
    }

    enableChangeTracking(entity: TEntity, defaults: DeepPartial<DeepOmit<TEntity, "DocumentType" | "_id" | "_rev">>, readonly: boolean, maps: PropertyMap<TDocumentType, TEntity, any>[]): TEntity {

        const instance = this.mapAndSetDefaults(entity, maps, defaults);
        const result = readonly ? Object.freeze(instance) : instance;

        return result;
    }

    merge(from: TEntity, to: TEntity) {
        const options: { skip: string[] } = { skip: [] };

        const hashCode = this._generateHashCode(to);
        this.originalAttachmentHashes[to._id] = hashCode;

        for (let property in from) {

            if (options?.skip && options.skip.includes(property)) {
                continue;
            }

            to[property] = from[property];
        }

        return to;
    }

    private _generateHashCode(entity: TEntity) {
        return hash(entity, { algorithm: "md5" });
    }

    async markDirty(...entities: TEntity[]) {

        for (const item of entities) {
            this.originalAttachmentHashes[item._id] = "-1";
        }

        return entities;
    }
}