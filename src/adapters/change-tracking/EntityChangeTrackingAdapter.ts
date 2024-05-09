import { SchemaDataStore } from "../../cache/SchemaDataStore";
import { List } from "../../common/List";
import { ExpandedProperty, ExpandedSchema, SchemaTypes } from "../../schema";
import { IDbSetChangeTracker, ProcessedChangesResult } from "../../types/change-tracking-types";
import { DeepPartial } from "../../types/common-types";
import { ITrackedChanges, IProcessedUpdates } from "../../types/context-types";
import { ChangeTrackingOptions, IDbSetProps } from "../../types/dbset-types";
import { IDbRecord, IIndexableEntity } from "../../types/entity-types";
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

    constructor(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>, dbPlugin: IDbPlugin<TDocumentType, TEntity, TExclusions>, schemaCache: SchemaDataStore<TDocumentType, TEntity, TExclusions>) {
        super(dbSetProps, changeTrackingOptions, dbPlugin, schemaCache);
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

        const expandedSchema = this.schemaCache.expand();

        if (expandedSchema != null) {

            const cache = this.schemaCache.get();

            if (cache.getChanges != null && cache.hasChanges != null) {
                const indexableEntity = entity as IIndexableEntity;
                const isDirty = cache.hasChanges(entity);
                const changes = cache.getChanges(entity);
                const result: ProcessedChangesResult<TDocumentType, TEntity> = {
                    isDirty,
                    deltas: isDirty === false ? null : { ...changes, [this.dbPlugin.idPropertyName]: entity[this.dbPlugin.idPropertyName] },
                    doc: entity,
                    original: entity,
                    timestamp: isDirty === false ? -1 : indexableEntity[EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY] as number
                };
                return result
            }

            const { properties } = expandedSchema;
            const changeTrackingProperties = [...properties.values()].filter(w => w.type === SchemaTypes.Object || w.type === SchemaTypes.Array);
            const mainProperties = [...expandedSchema.properties].filter(([_, w]) => (w.type === SchemaTypes.Array || w.type === SchemaTypes.Object) && w.childDegree === 0);
            const getChangesFunctions: string[] = [`
                const getChanges = (value) => {

                    if (value == null) {
                        return {};
                    }

                    const { ${mainProperties.length === 0 ? "_" : mainProperties.map(([_, w]) => w.propertyName).join(",")} ,...rest} = value;

                    return rest;
                }
                const changes = getChanges(entity.${EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY});

            `];
            const isDirtyFunctions: string[] = [`entity?.${EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER} === true`];

            for (const changeTrackingProperty of changeTrackingProperties) {
                isDirtyFunctions.push(`entity.${changeTrackingProperty.selectorPath}?.${EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER} === true`);

                if (changeTrackingProperty.type === SchemaTypes.Array) {
                    getChangesFunctions.push(`if (entity.${changeTrackingProperty.selectorPath}?.${EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY} != null) {
                        changes.${changeTrackingProperty.assignmentPath} = [...entity.${changeTrackingProperty.selectorPath}?.${EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY}];
                    }`);
                    continue;
                }

                getChangesFunctions.push(`if (entity.${changeTrackingProperty.selectorPath}?.${EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY} != null) {
                    changes.${changeTrackingProperty.assignmentPath} = {...entity.${changeTrackingProperty.selectorPath}?.${EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY}};
                }`);
            }

            getChangesFunctions.push('return changes;')

            const isDirtyFn = Function("entity", `return ${isDirtyFunctions.join(" || ")}`) as (entity: TEntity) => boolean;
            const getChangesFn = Function("entity", getChangesFunctions.join("\n")) as (entity: TEntity) => DeepPartial<TEntity>;

            cache.hasChanges = isDirtyFn;
            cache.getChanges = getChangesFn;

            this.schemaCache.put(cache);

            const indexableEntity = entity as IIndexableEntity;
            const isDirty = isDirtyFn(entity);
            const changes = isDirty === false ? {} as DeepPartial<TEntity> : getChangesFn(entity);
            const result: ProcessedChangesResult<TDocumentType, TEntity> = {
                isDirty,
                deltas: isDirty === false ? null : { ...changes, [this.dbPlugin.idPropertyName]: entity[this.dbPlugin.idPropertyName] },
                doc: entity,
                original: entity,
                timestamp: isDirty === false ? -1 : indexableEntity[EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY] as number
            };

            return result
        }

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
        const expandedSchema = this.schemaCache.expand();
        let merge = (entity: TEntity, partial: DeepPartial<TEntity>): TEntity => ({ ...entity, ...partial })

        if (expandedSchema != null) {
            const cache = this.schemaCache.get();

            if (cache.deepMerge == null) {

                const { properties } = expandedSchema;
                const changeTrackingProperties: (ExpandedProperty | ExpandedSchema)[] = [expandedSchema];

                for (const [_, schema] of properties) {

                    if (schema.type !== SchemaTypes.Object && schema.type !== SchemaTypes.Array) {
                        continue;
                    }

                    changeTrackingProperties.unshift(schema)
                }
                const strippers: string[] = [];

                // create deep merge
                for (const changeTrackingProperty of changeTrackingProperties) {

                    if ('idPropertyName' in changeTrackingProperty) {

                        //EntityChangeTrackingAdapter
                        const parentPropertyNamesToStrip = [...changeTrackingProperty.properties].filter(([_, w]) => (w.type === SchemaTypes.Array || w.type === SchemaTypes.Object) && w.childDegree === 0).map(([_, w]) => w.propertyName);

                        parentPropertyNamesToStrip.push(
                            EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY,
                            EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER,
                            EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY,
                            EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY,
                        );

                        const properties = parentPropertyNamesToStrip.join(",")
                        const stripObject = `
                        const stripParent = (value) => {
                            const { ${properties}, ...rest } = value;
                            return rest;
                        }
            
                        const strippedEntity = stripParent(entity);
                        const strippedPartial = stripParent(partial);`;


                        strippers.unshift(stripObject)
                        continue
                    }

                    const childProperties = [...changeTrackingProperty.properties].filter(([_, w]) => w.type === SchemaTypes.Array || w.type === SchemaTypes.Object).map(([w]) => w).join(",");
                    const stripArray = `strippedEntity.${changeTrackingProperty.assignmentPath} = [ ...entity.${changeTrackingProperty.selectorPath} ];`;
                    const stripObject = `
                    const strip = (value) => {
                        const { ${childProperties}, ...strippedEntity } = value;
                        return strippedEntity;
                    }
                    strippedEntity.${changeTrackingProperty.assignmentPath} = { ...strip(entity.${changeTrackingProperty.selectorPath}), ...partial(entity.${changeTrackingProperty.selectorPath}) };
                    `;
                    const fn = `
                    if (entity != null && entity.${changeTrackingProperty.selectorPath} != null && partial != null && partial.${changeTrackingProperty.selectorPath} != null) {    
                        ${changeTrackingProperty.type === SchemaTypes.Array ? stripArray : stripObject}
                    }`
                    strippers.push(fn);
                }

                strippers.unshift(`
                if (entity == null) {
                    return entity;
                }`);
                strippers.push(`return {...strippedEntity, ...strippedPartial};`);

                cache.deepMerge = Function("entity", "partial", strippers.join("\n")) as (entity: TEntity, partial: DeepPartial<TEntity>) => TEntity;

                this.schemaCache.put(cache)

            } 

            merge = cache.deepMerge;
        }

        const changes = this.getTrackedData();
        const { adds, removes, removesById, attachments, transactions } = changes;
        const updates = attachments
            .map(w => this.processChanges(w))
            .filter(w => w.isDirty === true)
            .map(w => {
                w.deltas = w.deltas;
                w.doc = merge(w.doc, w.deltas);
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

    // keep as property assignment to we can stringify it properly
    private _enableChangeTrackingForEntity = (entity: TEntity, markers: { dirty: string, original: string, changes: string, timestamp: string, proxy: string }, properties?: { [key: string]: any }) => {

        const { changes, dirty, original, timestamp, proxy } = markers
        const proxyHandler: ProxyHandler<TEntity> = {
            set: (entity, property, value) => {

                const indexableEntity: IIndexableEntity = entity as any;
                const key = String(property);

                // if we are the dirty marker or an untracked property, do not track changes
                if (key === dirty || properties != null && properties[key] == null) {
                    indexableEntity[key] = value;
                    return true;
                }

                const now = Date.now();

                if (property !== original) {
                    const originalValue = indexableEntity[key];

                    // if values are the same, do nothing
                    if (originalValue === value) {
                        return true;
                    }

                    if (indexableEntity[original] === undefined) {
                        indexableEntity[original] = {};
                    }

                    if (indexableEntity[changes] === undefined) {
                        indexableEntity[changes] = {};
                    }

                    if (indexableEntity[changes][key] != null) {

                        if (indexableEntity[original][key] === value) {
                            // we are changing the value back to the original value, remove the change
                            delete indexableEntity[original][key];
                            delete indexableEntity[changes][key];
                        } else {
                            // track the change
                            indexableEntity[changes][key] = value;
                            indexableEntity[timestamp] = now;
                        }

                    } else if (indexableEntity[changes][key] == null) {
                        // don't keep updating, keep the original value
                        indexableEntity[timestamp] = now;
                        indexableEntity[changes][key] = value;
                        indexableEntity[original][key] = originalValue;

                    }

                    const isDirty = Object.keys(indexableEntity[original]).length > 0;
                    indexableEntity[dirty] = isDirty;

                    if (isDirty === false && indexableEntity[timestamp] != null) {
                        delete indexableEntity[timestamp];
                    }
                }

                indexableEntity[key] = value;

                return true;
            },
            get: (target, property, receiver) => {

                if (property === proxy) {
                    return true;
                }

                return Reflect.get(target, property, receiver);
            }
        }

        return new Proxy(entity, proxyHandler as any) as TEntity
    }

    protected override enableChangeTracking(entity: TEntity) {

        const markers = {
            dirty: EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER,
            original: EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY,
            changes: EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY,
            timestamp: EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY,
            proxy: EntityChangeTrackingAdapter.PROXY_MARKER
        };
        const expandedSchema = this.schemaCache.expand();

        if (expandedSchema == null) {
            // there is no schema
            const ignoredProperites = [...this.changeTrackingOptions.untrackedPropertyNames].reduce((a, v) => ({ ...a, [v]: v }), {} as { [key: string]: any })
            return this._enableChangeTrackingForEntity(entity, markers, ignoredProperites);
        }

        const cache = this.schemaCache.get();

        if (cache.enableChangeTracking != null) {
            // return cached tracking
            return cache.enableChangeTracking(entity)
        }

        const { properties } = expandedSchema;
        const changeTrackingProperties: (ExpandedProperty | ExpandedSchema)[] = [expandedSchema];

        for (const [_, schema] of properties) {

            if (schema.type !== SchemaTypes.Object && schema.type !== SchemaTypes.Array) {
                continue;
            }

            changeTrackingProperties.unshift(schema)
        }

        const functions: string[] = [`const enableChangeTracking = ${this._enableChangeTrackingForEntity.toString()};`, `const markers = ${JSON.stringify(markers)};`];

        for (const changeTrackingProperty of changeTrackingProperties) {

            if ('idPropertyName' in changeTrackingProperty) {
                const fn = `
                if (entity == null) {
                    return entity;
                } 
                const mainProperties = {${[...changeTrackingProperty.properties].filter(([_, w]) => w.childDegree === 0).map(([_, w]) => `${w.propertyName}: true`).join(",")}};

                return enableChangeTracking(entity, markers, mainProperties);`
                functions.push(fn)
                continue
            }

            const fn = `
            if (entity != null && entity.${changeTrackingProperty.selectorPath} != null) {
                const properties = {${[...changeTrackingProperty.properties].map(([_, w]) => `${w.propertyName}: true`).join(",")}};
                entity.${changeTrackingProperty.assignmentPath} = enableChangeTracking(entity.${changeTrackingProperty.selectorPath}, markers, properties)
            }`

            functions.push(fn)

        }

        const enableChangeTracking = Function("entity", functions.join("\n")) as (entity: TEntity) => TEntity;

        cache.enableChangeTracking = enableChangeTracking;

        this.schemaCache.put(cache);

        return enableChangeTracking(entity)
    }

    merge(from: TEntity, to: TEntity) {
        const options = { skip: [...this.dbPlugin.skip, EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY, EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY, EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER] };

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