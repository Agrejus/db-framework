import { ReselectDictionary } from "../../common/ReselectDictionary";
import { IDbSetChangeTracker } from "../../types/change-tracking-types";
import { DeepPartial, DeepOmit } from "../../types/common-types";
import { ITrackedChanges, DbFrameworkEnvironment } from "../../types/context-types";
import { PropertyMap } from "../../types/dbset-builder-types";
import { IDbRecord, IIndexableEntity } from "../../types/entity-types";
import { ChangeTrackingAdapterBase } from "./ChangeTrackingAdapterBase";

/**
 * Uses proxy objects to track changes at the entity level.  Useful for fine grained change tracking regardless of the context
 */
export class EntityChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends ChangeTrackingAdapterBase<TDocumentType, TEntity, TExclusions> implements IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> {

    static readonly DIRTY_ENTITY_MARKER: string = "__isDirty";
    static readonly PRISTINE_ENTITY_KEY: string = "__pristine_entity__";
    static readonly CHANGES_ENTITY_KEY: string = "__changes__";
    static readonly PROXY_MARKER: string = "__isProxy";
    protected override attachments;

    constructor(idPropertyName: keyof TEntity, propertyMaps: PropertyMap<TDocumentType, TEntity, TExclusions>[], environment: DbFrameworkEnvironment) {
        super(idPropertyName, propertyMaps, environment);
        this.attachments = new ReselectDictionary<TDocumentType, TEntity>(idPropertyName)
    }

    static isProxy<T extends Object>(entities: T) {
        return (entities as IIndexableEntity)[EntityChangeTrackingAdapter.PROXY_MARKER] === true;
    }

    asUntracked(...entities: TEntity[]) {
        return entities.map(w => ({ ...w } as TEntity));
    }

    isDirty(entity: TEntity) {

        const indexableEntity = entity as IIndexableEntity;
        return indexableEntity[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] === true;
    }

    async makePristine(...entities: TEntity[]) {

        for (let i = 0; i < entities.length; i++) {
            const indexableEntity = entities[i] as IIndexableEntity;

            // make pristine again
            delete indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY];
            delete indexableEntity[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER];
        }
    }

    getPendingChanges(): ITrackedChanges<TDocumentType, TEntity> {
        const changes = this.getTrackedData();
        const { add, remove, removeById, attach } = changes;

        const updated = attach.filter(w => this.isDirty(w) === true).map(w => this.mapInstance(w, this.propertyMaps));

        return {
            add,
            remove,
            removeById,
            updated
        }
    }

    enableChangeTracking(entity: TEntity, defaults: DeepPartial<DeepOmit<TEntity, "DocumentType" | TExclusions>>, readonly: boolean, maps: PropertyMap<TDocumentType, TEntity, any>[]): TEntity {
        const proxyHandler: ProxyHandler<TEntity> = {
            set: (entity, property, value) => {

                const indexableEntity: IIndexableEntity = entity as any;
                const key = String(property);

                if (property !== EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY && indexableEntity._id != null) {
                    const oldValue = indexableEntity[key];

                    // if values are the same, do nothing
                    if (oldValue === value) {
                        return true;
                    }

                    if (indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY] === undefined) {
                        indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY] = {};
                    }

                    if (indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] != null && indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] === value) {
                        // we are changing the value back to the original value, remove the change
                        delete indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key];
                    } else if (indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] == null) {
                        // don't keep updating, keep the original value
                        indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] = oldValue;
                    }

                    indexableEntity[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] = Object.keys(indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY]).length > 0
                }

                indexableEntity[key] = value;

                return true;
            },
            get: (target, property, receiver) => {

                if (property === EntityChangeTrackingAdapter.PROXY_MARKER) {
                    return true;
                }

                return Reflect.get(target, property, receiver);
            }
        }

        const instance = this.mapAndSetDefaults(entity, maps, defaults);

        return new Proxy(instance, proxyHandler as any) as TEntity
    }

    merge(from: TEntity, to: TEntity) {
        const options = { skip: [EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY] };

        for (let property in from) {

            if (options?.skip && options.skip.includes(property)) {
                continue;
            }

            to[property] = from[property];
        }

        return to;
    }

    async markDirty(...entities: TEntity[]) {

        if (entities.some(w => EntityChangeTrackingAdapter.isProxy(w) === false)) {
            throw new Error(`Entities must be linked to context in order to mark as dirty`)
        }

        return entities.map(w => {
            (w as IIndexableEntity)[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] = true;
            return w;
        });
    }
}