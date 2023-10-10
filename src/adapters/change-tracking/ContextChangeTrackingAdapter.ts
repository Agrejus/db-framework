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
export class ContextChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends ChangeTrackingAdapterBase<TDocumentType, TEntity, TExclusions> {

    protected originalAttachmentHashes: { [key: string]: string } = {};
    protected override attachments;

    constructor(idPropertyName: keyof TEntity) {
        super(idPropertyName);
        this.attachments = new AdvancedDictionary<TDocumentType, TEntity>(idPropertyName)
    }

    asUntracked(...entities: TEntity[]) {
        return entities;
    }

    isDirty(entity: TEntity) {

        const id = entity[this.idPropertyName] as string;
        if (this.originalAttachmentHashes[id] == null) {
            return false
        }

        const hashCode = this._generateHashCode(entity);

        return this.originalAttachmentHashes[id] != hashCode;
    }

    makePristine(...entities: TEntity[]) {
        // no op
    }

    override reinitialize(removals: TEntity[] = [], add: TEntity[] = [], updates: TEntity[] = []): void {
        super.reinitialize(removals, add, updates);

        for (const item of add) {
            const hashCode = this._generateHashCode(item);
            const id = item[this.idPropertyName] as string;
            this.originalAttachmentHashes[id] = hashCode;
        }

        for (const item of updates) {
            const hashCode = this._generateHashCode(item);
            const id = item[this.idPropertyName] as string;
            this.originalAttachmentHashes[id] = hashCode;
        }

        for(const item of removals) {
            const id = item[this.idPropertyName] as string;
            delete this.originalAttachmentHashes[id]
        }

        // reconcile attachments so they all match, so we are not saving out of date information
        this.attachments.forEach((_, items) => {
            if (items.length <= 1) {
                return;
            }

            const last = items[items.length - 1];

            for(let i = 0; i < items.length - 1; i++) {
                this._mergeObjects(last, items[i]);
                const item = items[i];
                const hashCode = this._generateHashCode(item);
                const id = item[this.idPropertyName] as string;
                this.originalAttachmentHashes[id] = hashCode;
            }
        })
    }

    override attach(data: TEntity[]): void {

        super.attach(data);

        for (const item of data) {
            const hashCode = this._generateHashCode(item);
            const id = item[this.idPropertyName] as string;
            this.originalAttachmentHashes[id] = hashCode;
        }
    }

    getPendingChanges(changes: ITrackedData<TDocumentType, TEntity>, dbsets: DbSetMap): ITrackedChanges<TDocumentType, TEntity> {

        const { add, remove, removeById, attach } = changes;

        const deduplicatedUpdates = attach.filter(w => this.isDirty(w) === true).map(w => this.mapInstance(w, dbsets[w.DocumentType].info().Map)).reduce((a, v) => {

            const id = v[this.idPropertyName] as string;
            return {...a, [id]: v}
        }, {} as { [key: string]: TEntity });
        const updated = Object.values<TEntity>(deduplicatedUpdates);

        return {
            add,
            remove,
            removeById,
            updated
        }
    }

    enableChangeTracking(entity: TEntity, defaults: DeepPartial<DeepOmit<TEntity, "DocumentType" | TExclusions>>, readonly: boolean, maps: PropertyMap<TDocumentType, TEntity, any>[]): TEntity {

        const instance = this.mapAndSetDefaults(entity, maps, defaults);
        const result = readonly ? Object.freeze(instance) : instance;

        return result as TEntity;
    }

    private _mergeObjects(from: TEntity, to: TEntity) {

        for (let property in from) {
            to[property] = from[property];
        }

        return to;
    }

    merge(from: TEntity, to: TEntity) {

        const hashCode = this._generateHashCode(to);
        const id = to[this.idPropertyName] as string;
        this.originalAttachmentHashes[id] = hashCode;

        return this._mergeObjects(from, to)
    }

    private _generateHashCode(entity: TEntity) {
        return hash(entity, { algorithm: "md5" });
    }

    async markDirty(...entities: TEntity[]) {

        for (const item of entities) {
            const id = item[this.idPropertyName] as string;
            this.originalAttachmentHashes[id] = "-1";
        }

        return entities;
    }
}