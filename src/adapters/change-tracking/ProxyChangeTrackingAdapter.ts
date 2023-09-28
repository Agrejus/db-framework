import { DeepPartial, DeepOmit } from "../../types/common-types";
import { ITrackedData, ITrackedChanges } from "../../types/context-types";
import { PropertyMap } from "../../types/dbset-builder-types";
import { DbSetMap } from "../../types/dbset-types";
import { IDbRecord, IIndexableEntity } from "../../types/entity-types";
import { ChangeTrackingAdapterBase } from "./ChangeTrackingAdapterBase";

export class ProxyChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> extends ChangeTrackingAdapterBase<TDocumentType, TEntity> {

    static readonly DIRTY_ENTITY_MARKER: string = "__isDirty";
    static readonly PRISTINE_ENTITY_KEY: string = "__pristine_entity__";
    static readonly PROXY_MARKER: string = "__isProxy";

    static isProxy<T extends Object>(entities: T) {
        return (entities as IIndexableEntity)[ProxyChangeTrackingAdapter.PROXY_MARKER] === true;
    }

    asUntracked(...entities: TEntity[]) {
        return entities.map(w => ({ ...w } as TEntity));
    }

    isDirty(entity: TEntity) {

        const indexableEntity = entity as IIndexableEntity;
        if (indexableEntity[ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY] === undefined) {
            return false;
        }

        const pristineKeys = Object.keys(indexableEntity[ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY]);

        for (let pristineKey of pristineKeys) {
            if (indexableEntity[ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY][pristineKey] != indexableEntity[pristineKey]) {
                return true
            }
        }
        return false;
    }

    makePristine(...entities: TEntity[]) {

        for (let i = 0; i < entities.length; i++) {
            const indexableEntity = entities[i] as IIndexableEntity;

            // make pristine again
            delete indexableEntity[ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY];
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
        const proxyHandler: ProxyHandler<TEntity> = {
            set: (entity, property, value) => {

                const indexableEntity: IIndexableEntity = entity as any;
                const key = String(property);

                if (property === ProxyChangeTrackingAdapter.DIRTY_ENTITY_MARKER) {

                    if (indexableEntity[ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY] === undefined) {
                        indexableEntity[ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY] = {};
                    }

                    indexableEntity[ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY][ProxyChangeTrackingAdapter.DIRTY_ENTITY_MARKER] = true;
                    return true;
                }

                if (property !== ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY && indexableEntity._id != null) {
                    const oldValue = indexableEntity[key];

                    if (indexableEntity[ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY] === undefined) {
                        indexableEntity[ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY] = {};
                    }

                    if (indexableEntity[ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY][key] === undefined) {
                        indexableEntity[ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY][key] = oldValue;
                    }
                }

                indexableEntity[key] = value;

                return true;
            },
            get: (target, property, receiver) => {

                if (property === ProxyChangeTrackingAdapter.PROXY_MARKER) {
                    return true;
                }

                return Reflect.get(target, property, receiver);
            }
        }

        const instance = this.mapAndSetDefaults(entity, maps, defaults);
        const result = readonly ? Object.freeze(instance) : instance;

        return new Proxy(result, proxyHandler) as TEntity
    }

    merge(from: TEntity, to: TEntity) {
        const options = { skip: [ProxyChangeTrackingAdapter.PRISTINE_ENTITY_KEY] };

        for (let property in from) {

            if (options?.skip && options.skip.includes(property)) {
                continue;
            }

            to[property] = from[property];
        }

        return to;
    }

    async markDirty(...entities: TEntity[]) {

        if (entities.some(w => ProxyChangeTrackingAdapter.isProxy(w) === false)) {
            throw new Error(`Entities must be linked to context in order to mark as dirty`)
        }

        return entities.map(w => {
            (w as IIndexableEntity)[ProxyChangeTrackingAdapter.DIRTY_ENTITY_MARKER] = true;
            return w;
        });
    }
}