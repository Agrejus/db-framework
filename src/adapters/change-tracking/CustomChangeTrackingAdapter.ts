import { ReselectDictionary } from "../../common/ReselectDictionary";
import { ValueReselectDictionary } from "../../common/ValueReselectDictionary";
import { IAttachmentDictionary, IDbSetChangeTracker } from "../../types/change-tracking-types";
import { DeepPartial, DeepOmit, EntityComparator } from "../../types/common-types";
import { ITrackedChanges, DbFrameworkEnvironment } from "../../types/context-types";
import { PropertyMap } from "../../types/dbset-builder-types";
import { IDbRecord } from "../../types/entity-types";
import { ChangeTrackingAdapterBase } from "./ChangeTrackingAdapterBase";

/**
 * Uses custom object comparison defined by the developer, which is tracked at the context level.  Useful for applications that have trouble with proxy objects
 */
export class CustomChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends ChangeTrackingAdapterBase<TDocumentType, TEntity, TExclusions> implements IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> {

    protected override attachments;
    private _originals: IAttachmentDictionary<TDocumentType, TEntity>;
    private _comparator: EntityComparator<TDocumentType, TEntity>;
    private _dirtyMarkers: { [key in keyof TEntity]: true } = {} as any;

    constructor(idPropertyName: keyof TEntity, propertyMaps: PropertyMap<TDocumentType, TEntity, TExclusions>[], environment: DbFrameworkEnvironment, comparator: EntityComparator<TDocumentType, TEntity>) {
        super(idPropertyName, propertyMaps, environment);
        this.attachments = new ReselectDictionary<TDocumentType, TEntity>(idPropertyName);
        this._originals = new ValueReselectDictionary<TDocumentType, TEntity>(idPropertyName);
        this._comparator = comparator;
    }

    asUntracked(...entities: TEntity[]) {
        return entities;
    }

    isDirty(entity: TEntity) {

        const id = entity[this.idPropertyName] as keyof TEntity;
        const original = this._originals.get(id);

        if (this._dirtyMarkers[id] === true || original == null) {
            return true; // mark as dirty so we save it
        }

        const areEntitiesTheSame = this._comparator(entity, original);

        return areEntitiesTheSame === false;
    }

    makePristine(...entities: TEntity[]) {
        // no op
    }

    override reinitialize(removals: TEntity[] = [], add: TEntity[] = [], updates: TEntity[] = []): void {
        super.reinitialize(removals, add, updates);

        this._dirtyMarkers = {} as any;

        this._originals = new ValueReselectDictionary<TDocumentType, TEntity>(this.idPropertyName);
        this._originals.push(...this.attachments.all())       
    }

    override attach(data: TEntity[]) {
        this._originals.push(...data)
        return super.attach(data);
    }

    getPendingChanges(): ITrackedChanges<TDocumentType, TEntity> {

        const changes = this.getTrackedData();
        const { add, remove, removeById, attach } = changes;

        const deduplicatedUpdates = attach.filter(w => this.isDirty(w) === true).map(w => this.mapInstance(w, this.propertyMaps)).reduce((a, v) => {

            const id = v[this.idPropertyName] as string;
            return { ...a, [id]: v }
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
        return this.mapAndSetDefaults(entity, maps, defaults) as TEntity;
    }

    merge(from: TEntity, to: TEntity) {
        for (let property in from) {
            to[property] = from[property];
        }

        return to;
    }

    async markDirty(...entities: TEntity[]) {

        for (const item of entities) {
            const id = item[this.idPropertyName] as keyof TEntity;
            this._dirtyMarkers[id] = true
        }

        return entities;
    }
}