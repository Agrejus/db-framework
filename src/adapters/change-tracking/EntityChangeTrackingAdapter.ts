import { ReselectDictionary } from "../../common/ReselectDictionary";
import { DeepPartial, DeepOmit } from "../../types/common-types";
import { ITrackedData, ITrackedChanges, DbFrameworkEnvironment } from "../../types/context-types";
import { PropertyMap } from "../../types/dbset-builder-types";
import { DbSetMap } from "../../types/dbset-types";
import { IDbRecord, IIndexableEntity } from "../../types/entity-types";
import { ChangeTrackingAdapterBase } from "./ChangeTrackingAdapterBase";

/**
 * Uses proxy objects to track changes at the entity level.  Useful for fine grained change tracking regardless of the context
 */
export class EntityChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends ChangeTrackingAdapterBase<TDocumentType, TEntity, TExclusions> {

    static readonly DIRTY_ENTITY_MARKER: string = "__isDirty";
    static readonly PRISTINE_ENTITY_KEY: string = "__pristine_entity__";
    static readonly PROXY_MARKER: string = "__isProxy";
    protected override attachments;

    constructor(idPropertyName: keyof TEntity, environment: DbFrameworkEnvironment) {
        super(idPropertyName, environment);
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
        if (indexableEntity[EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY] === undefined) {
            return false;
        }

        const pristineKeys = Object.keys(indexableEntity[EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY]);

        for (let pristineKey of pristineKeys) {
            if (indexableEntity[EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY][pristineKey] != indexableEntity[pristineKey]) {
                return true
            }
        }
        return false;
    }

    makePristine(...entities: TEntity[]) {

        for (let i = 0; i < entities.length; i++) {
            const indexableEntity = entities[i] as IIndexableEntity;

            // make pristine again
            delete indexableEntity[EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY];
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

    enableChangeTracking(entity: TEntity, defaults: DeepPartial<DeepOmit<TEntity, "DocumentType" | TExclusions>>, readonly: boolean, maps: PropertyMap<TDocumentType, TEntity, any>[]): TEntity {
        const proxyHandler: ProxyHandler<TEntity> = {
            set: (entity, property, value) => {

                const indexableEntity: IIndexableEntity = entity as any;
                const key = String(property);

                if (property === EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER) {

                    if (indexableEntity[EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY] === undefined) {
                        indexableEntity[EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY] = {};
                    }

                    indexableEntity[EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY][EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] = true;
                    return true;
                }

                if (property !== EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY && indexableEntity._id != null) {
                    const oldValue = indexableEntity[key];

                    if (indexableEntity[EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY] === undefined) {
                        indexableEntity[EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY] = {};
                    }

                    if (indexableEntity[EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY][key] === undefined) {
                        indexableEntity[EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY][key] = oldValue;
                    }
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
        const result = readonly ? Object.freeze(instance) : instance;

        return new Proxy(result, proxyHandler as any) as TEntity
    }

    merge(from: TEntity, to: TEntity) {
        const options = { skip: [EntityChangeTrackingAdapter.PRISTINE_ENTITY_KEY] };

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