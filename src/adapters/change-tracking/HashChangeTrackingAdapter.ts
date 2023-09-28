import { DeepPartial, DeepOmit } from "../../types/common-types";
import { ITrackedData, ITrackedChanges } from "../../types/context-types";
import { PropertyMap } from "../../types/dbset-builder-types";
import { DbSetMap } from "../../types/dbset-types";
import { IDbRecord } from "../../types/entity-types";
import { ChangeTrackingAdapterBase } from "./ChangeTrackingAdapterBase";
import hash from 'object-hash';

export class HashChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> extends ChangeTrackingAdapterBase<TDocumentType, TEntity> {

    protected originalAttachmentHashes: { [key: string]: string } = {};

    asUntracked(...entities: TEntity[]) {
        return entities;
    }

    isDirty(entity: TEntity) {

        if (this.originalAttachmentHashes[entity._id] == null) {
            return false
        }

        const hashCode = hash(entity, { algorithm: "md5" });

        return this.originalAttachmentHashes[entity._id] != hashCode;
    }

    makePristine(...entities: TEntity[]) {
        // no op
    }

    override reinitialize(removals?: TEntity[], add?: TEntity[]): void {
        super.reinitialize(removals, add);
        this.originalAttachmentHashes = {};

        const adds = add ?? [];

        for(const item of adds) {
            const hashCode = hash(item, { algorithm: "md5" });
            this.originalAttachmentHashes[item._id] = hashCode;
        }
    }

    override attach(data: TEntity[]): void {
        super.attach(data);

        for(const item of data) {
            const hashCode = hash(item, { algorithm: "md5" });
            this.originalAttachmentHashes[item._id] = hashCode;
        }
    }

    getPendingChanges(changes: ITrackedData<TDocumentType, TEntity>, dbsets: DbSetMap): ITrackedChanges<TDocumentType, TEntity> {
        const { add, remove, removeById, attach } = changes;

        const updated = attach.filter(w => this.isDirty(w) === true).map(w => this.mapInstance(w, dbsets[w.DocumentType].info().Map));

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

        for (let property in from) {

            if (options?.skip && options.skip.includes(property)) {
                continue;
            }

            to[property] = from[property];
        }

        return to;
    }

    async markDirty(...entities: TEntity[]) {

        for(const item of entities) {
            this.originalAttachmentHashes[item._id] = "-1";
        }

        return entities;
    }
}