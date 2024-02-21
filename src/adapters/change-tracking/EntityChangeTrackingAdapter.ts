import { memoryCache } from "../../cache/MemoryCache";
import { List } from "../../common/List";
import { IDbSetChangeTracker, ProcessedChangesResult } from "../../types/change-tracking-types";
import { DeepPartial } from "../../types/common-types";
import { ITrackedChanges, IProcessedUpdates } from "../../types/context-types";
import { ChangeTrackingOptions, IDbSetProps } from "../../types/dbset-types";
import { IDbRecord, IIndexableEntity } from "../../types/entity-types";
import { IChangeTrackingCache } from "../../types/memory-cache-types";
import { IDbPlugin } from "../../types/plugin-types";
import { ChangeTrackingAdapterBase } from "./ChangeTrackingAdapterBase";

/**
 * Uses proxy objects to track changes at the entity level.  Useful for fine grained change tracking regardless of the context
 */
export class EntityChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends ChangeTrackingAdapterBase<TDocumentType, TEntity, TExclusions> implements IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> {

    static readonly DIRTY_ENTITY_MARKER: string = "__isDirty";
    static readonly CHANGES_ENTITY_KEY: string = "__changed__";
    static readonly ORIGINAL_ENTITY_KEY: string = "__original__";
    static readonly TIMESTAMP_ENTITY_KEY: string = "__timestamp__";
    static readonly PROXY_MARKER: string = "__isProxy";
    protected override attachments;

    constructor(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>, dbPlugin: IDbPlugin<TDocumentType, TEntity, TExclusions>) {
        super(dbSetProps, changeTrackingOptions, dbPlugin);
        this.attachments = new List<TEntity>(dbPlugin.idPropertyName)
    }

    static isProxy<T extends Object>(entities: T) {
        return (entities as IIndexableEntity)[EntityChangeTrackingAdapter.PROXY_MARKER] === true;
    }

    asUntracked(...entities: TEntity[]) {
        return entities.map(w => ({ ...w } as TEntity));
    }

    override reinitialize(removals: TEntity[] = [], add: TEntity[] = [], updates: TEntity[] = []): void {
        super.reinitialize(removals, add, updates);

        // move updates to attachments
        this.attachments.put(...updates);
    }

    processChanges(entity: TEntity): ProcessedChangesResult<TDocumentType, TEntity> {

        const indexableEntity = entity as IIndexableEntity;
        const isDirty = indexableEntity[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] === true;
        const changes = indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY] as DeepPartial<TEntity>;
        const result: ProcessedChangesResult<TDocumentType, TEntity> = {
            isDirty,
            deltas: isDirty === false ? null : { ...changes, [this.dbPlugin.idPropertyName]: entity[this.dbPlugin.idPropertyName] },
            doc: entity,
            original: entity,
            timestamp: isDirty === false ? -1 : indexableEntity[EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY] as number
        };
        return result
    }

    getPendingChanges(): ITrackedChanges<TDocumentType, TEntity> {
        const changes = this.getTrackedData();
        const { adds, removes, removesById, attachments, transactions } = changes;
        const updates = attachments
            .map(w => this.processChanges(w))
            .filter(w => w.isDirty === true)
            .map(w => {
                w.deltas = w.deltas;
                w.doc = { ...w.doc, ...w.deltas }; // write mapping changes to the main doc,
                return w;
            })
            .reduce((a, v) => {

                const id = v.doc[this.dbPlugin.idPropertyName] as string | number;
                a.docs[id] = v.doc;
                a.deltas[id] = v.deltas;
                a.originals[id] = v.original;
                a.timestamp[id] = v.timestamp;

                return a;
            }, { deltas: {}, docs: {}, originals: {}, timestamp: {}, timestamps: {} } as IProcessedUpdates<TDocumentType, TEntity>);

        return {
            adds,
            removes,
            removesById,
            updates,
            transactions
        }
    }

    protected override enableChangeTracking(entity: TEntity) {
        const proxyHandler: ProxyHandler<TEntity> = {
            set: (entity, property, value) => {

                const indexableEntity: IIndexableEntity = entity as any;
                const key = String(property);

                if (key === EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER || this.changeTrackingOptions.untrackedPropertyNames.has(key)) {
                    indexableEntity[key] = value;
                    return true;
                }

                const now = Date.now();

                if (property !== EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY && entity[this.dbPlugin.idPropertyName] != null) {
                    const originalValue = indexableEntity[key];

                    // if values are the same, do nothing
                    if (originalValue === value) {
                        return true;
                    }

                    // handle ignored enhancer properties if any
                    if (this.dbSetProps.enhancer != null) {

                        const cache = memoryCache.get<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this.changeTrackingId);
                        let enrichmentPropertyNames = cache.enrichmentPropertyNames ?? new Set<keyof TEntity>();
    
                        if (cache?.enrichmentPropertyNames == null) {
                            const enhanced = this.dbSetProps.enhancer(entity);
                            enrichmentPropertyNames = new Set<keyof TEntity>(Object.keys(enhanced) as (keyof TEntity)[]);
                            memoryCache.put<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this.changeTrackingId, { enrichmentPropertyNames });
                        }
    
                        if (enrichmentPropertyNames.size > 0 && enrichmentPropertyNames.has(key as keyof TEntity) === true) {
                            // don't track changes to enrichment properties, only set the property
                            indexableEntity[key] = value;
                            return true;
                        }
                    }

                    if (indexableEntity[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY] === undefined) {
                        indexableEntity[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY] = {};
                    }

                    if (indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY] === undefined) {
                        indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY] = {};
                    }


                    if (indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] != null) {

                        if (indexableEntity[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY][key] === value) {
                            // we are changing the value back to the original value, remove the change
                            delete indexableEntity[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY][key];
                            delete indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key];
                        } else {
                            // track the change
                            indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] = value;
                            indexableEntity[EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY] = now;
                        }

                    } else if (indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] == null) {
                        // don't keep updating, keep the original value
                        indexableEntity[EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY] = now;
                        indexableEntity[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY][key] = value;
                        indexableEntity[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY][key] = originalValue;

                    }

                    const isDirty = Object.keys(indexableEntity[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY]).length > 0;
                    indexableEntity[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] = isDirty;

                    if (isDirty === false && indexableEntity[EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY] != null) {
                        delete indexableEntity[EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY];
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
            (w as IIndexableEntity)[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] = true;
            return w;
        });
    }

    link(found: TEntity[]) {
        const enrich = this.enrichment.compose("defaultAdd", "changeTracking", "enhance")
        const result = found.map(enrich);
        return this.attach(...result);
    }
}