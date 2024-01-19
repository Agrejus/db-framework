import { ReselectDictionary } from "../../common/ReselectDictionary";
import { IDbSetChangeTracker, ProcessedChangesResult } from "../../types/change-tracking-types";
import { DeepPartial } from "../../types/common-types";
import { ITrackedChanges, IEntityUpdates } from "../../types/context-types";
import { ChangeTrackingOptions } from "../../types/dbset-types";
import { IDbRecord, IIndexableEntity } from "../../types/entity-types";
import { ChangeTrackingAdapterBase } from "./ChangeTrackingAdapterBase";

/**
 * Uses proxy objects to track changes at the entity level.  Useful for fine grained change tracking regardless of the context
 */
export class EntityChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends ChangeTrackingAdapterBase<TDocumentType, TEntity, TExclusions> implements IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> {

    static readonly DIRTY_ENTITY_MARKER: string = "__isDirty";
    static readonly CHANGES_ENTITY_KEY: string = "__changed__";
    static readonly ORIGINAL_ENTITY_KEY: string = "__original__";
    static readonly PROXY_MARKER: string = "__isProxy";
    protected override attachments;

    constructor(options: ChangeTrackingOptions<TDocumentType, TEntity, TExclusions>) {
        super(options);
        this.attachments = new ReselectDictionary<TDocumentType, TEntity>(options.idPropertyName)
    }

    static isProxy<T extends Object>(entities: T) {
        return (entities as IIndexableEntity)[EntityChangeTrackingAdapter.PROXY_MARKER] === true;
    }

    asUntracked(...entities: TEntity[]) {
        return entities.map(w => ({ ...w } as TEntity));
    }

    processChanges(entity: TEntity): ProcessedChangesResult<TDocumentType, TEntity> {

        const indexableEntity = entity as IIndexableEntity;
        const isDirty = indexableEntity[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] === true;
        const changes = indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY] as DeepPartial<TEntity>;
        const result: ProcessedChangesResult<TDocumentType, TEntity> = {
            isDirty,
            deltas: isDirty === false ? null : { ...changes, [this.options.idPropertyName]: entity[this.options.idPropertyName] },
            doc: entity,
            original: entity
        };
        return result
    }

    getPendingChanges(): ITrackedChanges<TDocumentType, TEntity> {
        const changes = this.getTrackedData();
        const { add, remove, removeById, attach } = changes;

        const updated = attach
            .map(w => this.processChanges(w))
            .filter(w => w.isDirty === true)
            .map(w => {
                w.deltas = this.enrichment.map(w.deltas as TEntity) as DeepPartial<TEntity>;
                w.doc = { ...w.doc, ...w.deltas }; // write mapping changes to the main doc,
                return w;
            })
            .reduce((a, v) => {

                const id = v.doc[this.options.idPropertyName] as string | number;
                a.docs[id] = v.doc;
                a.deltas[id] = v.deltas;
                a.originals.push(v.original);
                return a;
            }, { deltas: {}, docs: {}, originals: [] } as IEntityUpdates<TDocumentType, TEntity>);

        return {
            add,
            remove,
            removeById,
            updated
        }
    }

    enableChangeTracking(entity: TEntity) {
        const proxyHandler: ProxyHandler<TEntity> = {
            set: (entity, property, value) => {

                const indexableEntity: IIndexableEntity = entity as any;
                const key = String(property);

                if (key === EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER) {
                    indexableEntity[key] = value;
                    return true;
                }

                if (property !== EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY && entity[this.options.idPropertyName] != null) {
                    const originalValue = indexableEntity[key];

                    // if values are the same, do nothing
                    if (originalValue === value) {
                        return true;
                    }

                    if (indexableEntity[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY] === undefined) {
                        indexableEntity[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY] = {};
                    }

                    if (indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY] === undefined) {
                        indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY] = {};
                    }

                    if (indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] != null) {

                        if (indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] === value) {
                            // we are changing the value back to the original value, remove the change
                            delete indexableEntity[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY][key];
                            delete indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key];
                        } else {
                            // track the change
                            indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] = value;
                        }

                    } else if (indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] == null) {
                        // don't keep updating, keep the original value
                        indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] = value;
                        indexableEntity[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY][key] = originalValue;

                    }

                    indexableEntity[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] = Object.keys(indexableEntity[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY]).length > 0
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

        return new Proxy(entity, proxyHandler as any) as TEntity
    }

    merge(from: TEntity, to: TEntity) {
        const options = { skip: [EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY, EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY, EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] };

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
            (w as IIndexableEntity)[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] = true; 7
            return w;
        });
    }

    link(found: TEntity[]) {
        const result = found.map(w => {
            const enriched = this.enrichment.add(w);
            return this.enableChangeTracking(enriched);
        });
        return this.attach(result);
    }
}