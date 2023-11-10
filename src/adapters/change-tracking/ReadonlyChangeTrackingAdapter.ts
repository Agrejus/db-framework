import { ReselectDictionary } from "../../common/ReselectDictionary";
import { IDbSetChangeTracker } from "../../types/change-tracking-types";
import { DeepPartial, DeepOmit } from "../../types/common-types";
import { ITrackedChanges, DbFrameworkEnvironment } from "../../types/context-types";
import { PropertyMap } from "../../types/dbset-builder-types";
import { IDbRecord } from "../../types/entity-types";
import { ChangeTrackingAdapterBase } from "./ChangeTrackingAdapterBase";

/**
 * Throws out all changes since it is read only
 */
export class ReadonlyChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends ChangeTrackingAdapterBase<TDocumentType, TEntity, TExclusions> implements IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> {

    protected override attachments;

    constructor(idPropertyName: keyof TEntity, propertyMaps: PropertyMap<TDocumentType, TEntity, TExclusions>[], environment: DbFrameworkEnvironment) {
        super(idPropertyName, propertyMaps, environment);
        this.attachments = new ReselectDictionary<TDocumentType, TEntity>(idPropertyName)
    }

    asUntracked(...entities: TEntity[]) {
        return entities;
    }

    isDirty(entity: TEntity) {
        return false;
    }

    makePristine(...entities: TEntity[]) {

    }

    override attach(data: TEntity[]) {
        return data;
    }

    getPendingChanges(): ITrackedChanges<TDocumentType, TEntity> {

        const changes = this.getTrackedData();
        const { add } = changes;

        return {
            add,
            remove: [],
            removeById: [],
            updated: []
        }
    }

    enableChangeTracking(entity: TEntity, defaults: DeepPartial<DeepOmit<TEntity, "DocumentType" | TExclusions>>, readonly: boolean, maps: PropertyMap<TDocumentType, TEntity, any>[]): TEntity {
        const instance = this.mapAndSetDefaults(entity, maps, defaults);
        const result = readonly ? Object.freeze(instance) : instance;

        return result as TEntity;
    }

    merge(from: TEntity, to: TEntity) {
        for (const property in from) {
            to[property] = from[property];
        }

        return to;
    }

    async markDirty(...entities: TEntity[]) {
        return entities;
    }
}