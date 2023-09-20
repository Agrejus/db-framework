import { AdvancedDictionary } from "../common/AdvancedDictionary";
import { IIndexApi } from "../indexing/IndexApi";
import { DeepPartial, IPreviewChanges } from "../types/common-types";
import { IDataContext, ITrackedData } from "../types/context-types";
import { EntityAndTag, IDbSet, IDbSetApi } from "../types/dbset-types";
import { IDbRecordBase, OmittedEntity, IIndexableEntity, SplitDocumentDocumentPropertyName, SplitDocumentPathPropertyName, IDbRecord } from "../types/entity-types";
import { PropertyMap } from '../types/dbset-builder-types';
import { DbSetInitializer } from './dbset/builders/DbSetInitializer';
import { DbPluginInstanceCreator, IDbPlugin, IDbPluginOptions } from '../types/plugin-types';

// PouchDB.plugin(findAdapter);
// PouchDB.plugin(memoryAdapter);
// fluent API? DataContext.use<>().create();
export class DataContext<TDocumentType extends string, TPluginOptions extends IDbPluginOptions, TEntityBase extends IDbRecord<TDocumentType>, TQueryRequest, TQueryResponse> implements IDataContext<TDocumentType, TEntityBase> {

    protected readonly PRISTINE_ENTITY_KEY = "__pristine_entity__";
    protected readonly DIRTY_ENTITY_MARKER = "__isDirty";
    static PROXY_MARKER: string = '__isProxy';

    protected _removals: TEntityBase[] = [];
    protected _additions: TEntityBase[] = [];
    protected _attachments: AdvancedDictionary<TEntityBase> = new AdvancedDictionary<TEntityBase>("_id");
    private _tags: { [id: string]: unknown } = {}

    protected _removeById: string[] = [];

    $indexes: IIndexApi;
    private _dbPlugin: IDbPlugin<TDocumentType, TEntityBase, TQueryRequest, TQueryResponse>;

    protected dbSets: { [key: string]: IDbSet<string, any> } = {} as { [key: string]: IDbSet<string, any> };

    constructor(options: TPluginOptions, Plugin: DbPluginInstanceCreator<TDocumentType, TEntityBase, TQueryRequest, TQueryResponse>) {
        // const { ...pouchDb } = options ?? {};
        // super(name, pouchDb);
        this._dbPlugin = new Plugin(options);

        //this.$indexes = new IndexApi(this.doWork.bind(this));
    }

    async getAllDocs() {

        const all = await this._dbPlugin.all();

        return all.map(w => {

            const dbSet = this.dbSets[w.DocumentType] as (IDbSet<TDocumentType, TEntityBase, any> | undefined);

            if (dbSet) {
                const info = dbSet.info();

                return this._makeTrackable(w, info.Defaults.retrieve, info.Readonly, info.Map)
            }

            return w
        });
    }

    // /**
    //  * Enable DataContext speed optimizations.  Needs to be run once per application per database.  Typically, this should be run on application start.
    //  * @returns void
    //  */
    // async optimize() {

    //     // once this index is created any read's will rebuild the index 
    //     // automatically.  The first read may be slow once new data is created
    //     await this.$indexes.create(w =>
    //         w.name("autogen_document-type-index")
    //             .designDocumentName("autogen_document-type-index")
    //             .fields(x => x.add("DocumentType")));

    //     cache.upsert(CacheKeys.IsOptimized, true)
    // }

    /**
     * Gets an instance of IDataContext to be used with DbSets
     */
    protected getContext() { return this; }

    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    private _getApi(): IDbSetApi<TDocumentType, TEntityBase> {
        return {
            getTrackedData: this._getTrackedData.bind(this),
            getAllData: this._dbPlugin.all.bind(this),
            send: this._sendData.bind(this),
            detach: this._detach.bind(this),
            makeTrackable: this._makeTrackable.bind(this),
            get: this._dbPlugin.get.bind(this),
            getStrict: this._dbPlugin.getStrict.bind(this),
            map: this._mapAndSetDefaults.bind(this),
            DIRTY_ENTITY_MARKER: this.DIRTY_ENTITY_MARKER,
            PRISTINE_ENTITY_KEY: this.PRISTINE_ENTITY_KEY,
            makePristine: this._makePristine.bind(this),
            query: this._dbPlugin.query.bind(this),
            tag: this._tag.bind(this)
        }
    }

    private _tag(id: string, value: unknown) {
        this._tags[id] = value;
    }

    protected addDbSet(dbset: IDbSet<string, any>) {

        const info = (dbset as IDbSet<any, any, any>).info();

        if (this.dbSets[info.DocumentType] != null) {
            throw new Error(`Can only have one DbSet per document type in a context, please create a new context instead`)
        }

        this.dbSets[info.DocumentType] = dbset;
    }

    /**
     * Used by the context api
     * @param data 
     */
    private _detach(data: TEntityBase[]) {
        this._attachments.remove(...data);
    }

    /**
     * Used by the context api
     * @param data 
     */
    private _sendData(data: TEntityBase[]) {
        this._attachments.push(...data)
    }

    /**
     * Used by the context api
     */
    private _getTrackedData() {
        return {
            add: this._additions,
            remove: this._removals,
            attach: this._attachments,
            removeById: this._removeById
        } as ITrackedData<TDocumentType, TEntityBase>;
    }

    private _reinitialize(removals: TEntityBase[] = [], add: TEntityBase[] = []) {
        this._additions = [];
        this._removals = [];
        this._removeById = [];

        this._attachments.remove(...removals);

        // move additions to attachments so we can track changes
        this._attachments.push(...add);
    }

    /**
     * Provides equality comparison for Entities
     * @param first 
     * @param second 
     * @returns boolean
     */
    private areEqual(first: TEntityBase, second: TEntityBase) {

        if (!first && !second) {
            return true;
        }

        if (!first || !second) {
            return false;
        }

        const skip = ["_id", "_rev"];
        const keys = Object.keys(first).filter(w => skip.includes(w) === false);

        return keys.some(w => {
            const firstPropertyValue = (first as any)[w];
            const secondPropertyValue = (second as any)[w];

            if (Array.isArray(firstPropertyValue) && Array.isArray(secondPropertyValue)) {
                return firstPropertyValue.length === secondPropertyValue.length && firstPropertyValue.every((val, index) => val === secondPropertyValue[index]);
            }

            return (first as any)[w] != (second as any)[w]
        }) === false;
    }

    private _mapInstance<T extends Object>(entity: T, maps: PropertyMap<any, any, any>[]) {

        const result: IIndexableEntity = entity;

        for (const map of maps) {
            result[map.property] = map.map(result[map.property], entity)
        }

        return result as T
    }

    private _mapAndSetDefaults<T extends Object>(entity: T, maps: PropertyMap<any, any, any>[], defaults: DeepPartial<OmittedEntity<T>> = {} as any) {
        const mergedInstance = { ...defaults, ...entity };
        let mappedInstance = {};

        if (maps.length > 0) {
            mappedInstance = maps.reduce((a, v) => {
                const preTransformValue = (mergedInstance as any)[v.property];
                return { ...a, [v.property]: Object.prototype.toString.call(preTransformValue) === '[object Date]' ? preTransformValue : v.map(preTransformValue, entity) }
            }, {});
        }

        return { ...mergedInstance, ...mappedInstance };
    }

    private _makeTrackable<T extends Object>(entity: T, defaults: DeepPartial<OmittedEntity<T>>, readonly: boolean, maps: PropertyMap<any, any, any>[]): T {
        const proxyHandler: ProxyHandler<T> = {
            set: (entity, property, value) => {

                const indexableEntity: IIndexableEntity = entity as any;
                const key = String(property);

                if (property === this.DIRTY_ENTITY_MARKER) {

                    if (indexableEntity[this.PRISTINE_ENTITY_KEY] === undefined) {
                        indexableEntity[this.PRISTINE_ENTITY_KEY] = {};
                    }

                    indexableEntity[this.PRISTINE_ENTITY_KEY][this.DIRTY_ENTITY_MARKER] = true;
                    return true;
                }

                if (property !== this.PRISTINE_ENTITY_KEY && indexableEntity._id != null) {
                    const oldValue = indexableEntity[key];

                    if (indexableEntity[this.PRISTINE_ENTITY_KEY] === undefined) {
                        indexableEntity[this.PRISTINE_ENTITY_KEY] = {};
                    }

                    if (indexableEntity[this.PRISTINE_ENTITY_KEY][key] === undefined) {
                        indexableEntity[this.PRISTINE_ENTITY_KEY][key] = oldValue;
                    }
                }

                indexableEntity[key] = value;

                return true;
            },
            get: (target, property, receiver) => {

                if (property === DataContext.PROXY_MARKER) {
                    return true;
                }

                return Reflect.get(target, property, receiver);
            }
        }

        const instance = this._mapAndSetDefaults(entity, maps, defaults);
        const result = readonly ? Object.freeze(instance) : instance;

        return new Proxy(result, proxyHandler) as T
    }

    private _getPendingChanges() {
        const { add, remove, removeById } = this._getTrackedData();

        const updated = this._attachments.filter(w => {

            const indexableEntity = w as IIndexableEntity;
            if (indexableEntity[this.PRISTINE_ENTITY_KEY] === undefined) {
                return false;
            }

            const pristineKeys = Object.keys(indexableEntity[this.PRISTINE_ENTITY_KEY]);

            for (let pristineKey of pristineKeys) {
                if (indexableEntity[this.PRISTINE_ENTITY_KEY][pristineKey] != indexableEntity[pristineKey]) {
                    return true
                }
            }

            return false;
        }).map(w => this._mapInstance(w, this.dbSets[w.DocumentType].info().Map));

        return {
            add,
            remove,
            removeById,
            updated
        }
    }

    async previewChanges(): Promise<IPreviewChanges<TDocumentType, TEntityBase>> {
        const { add, remove, updated } = await this._getModifications();
        const clone = JSON.stringify({
            add,
            remove,
            update: updated
        });

        return JSON.parse(clone)
    }

    private _makePristine(...entities: TEntityBase[]) {

        for (let i = 0; i < entities.length; i++) {
            const indexableEntity = entities[i] as IIndexableEntity;

            // make pristine again
            delete indexableEntity[this.PRISTINE_ENTITY_KEY];
        }
    }

    private async _getModifications() {
        const { add, remove, removeById, updated } = this._getPendingChanges();

        const extraRemovals = await this._dbPlugin.getStrict(...removeById);

        return {
            add,
            remove: [...remove, ...extraRemovals].map(w => {

                let result = { ...w, _id: w._id, _rev: w._rev, DocumentType: w.DocumentType, _deleted: true } as IIndexableEntity;

                if ((w as IIndexableEntity)[SplitDocumentPathPropertyName] != null) {
                    result = { ...result, [SplitDocumentPathPropertyName]: (w as IIndexableEntity)[SplitDocumentPathPropertyName] }
                }

                if ((w as IIndexableEntity)[SplitDocumentDocumentPropertyName] != null) {
                    result = { ...result, [SplitDocumentDocumentPropertyName]: (w as IIndexableEntity)[SplitDocumentDocumentPropertyName] }
                }

                return result as TEntityBase
            }),
            updated
        }
    }

    private async _beforeSaveChanges() {
        const beforeOnBeforeSaveChangesTags = this._getTagsForTransaction();
        const beforeSaveChanges = await this._getModifications();

        // Devs are allowed to modify data/add data in onBeforeSaveChanges.  Useful for
        // creating history dbset that tracks changes in another dbset
        await this.onBeforeSaveChanges(() => ({
            adds: beforeSaveChanges.add.map(w => ({ entity: w, tag: beforeOnBeforeSaveChangesTags[w._id] } as EntityAndTag<TEntityBase>)),
            removes: beforeSaveChanges.remove.map(w => ({ entity: w, tag: beforeOnBeforeSaveChangesTags[w._id] } as EntityAndTag<TEntityBase>)),
            updates: beforeSaveChanges.updated.map(w => ({ entity: w, tag: beforeOnBeforeSaveChangesTags[w._id] } as EntityAndTag<TEntityBase>))
        }));

        // get tags again in case more were added in onBeforeSaveChanges
        const afterOnBeforeSaveChangesTags = this._getTagsForTransaction();
        const changes = await this._getModifications();
        const tags = { ...beforeOnBeforeSaveChangesTags, ...afterOnBeforeSaveChangesTags }

        return {
            tags,
            changes
        }
    }

    async saveChanges() {
        try {

            const { tags, changes } = await this._beforeSaveChanges();

            const { add, remove, updated } = changes;

            // Process removals first, so we can remove items first and then add.  Just
            // in case are are trying to remove and add the same Id
            const modifications = [...remove, ...add, ...updated];

            // remove pristine entity before we send to bulk docs
            this._makePristine(...modifications);

            const modificationResult = await this._dbPlugin.bulkOperations({ adds: add, removes: remove, updates: updated });

            for (let i = 0; i < modifications.length; i++) {
                const modification = modifications[i];
                const found = modificationResult.successes[modification._id];

                // update the rev in case we edit the record again
                if (found && found.ok === true) {
                    const indexableEntity = modification as IIndexableEntity;
                    indexableEntity._rev = found.rev;

                    this.onAfterSetRev(indexableEntity);

                    // make pristine again because we set the _rev above
                    this._makePristine(modification);
                }
            }

            this._reinitialize(remove, add);

            await this.onAfterSaveChanges(() => JSON.parse(JSON.stringify({
                adds: add.map(w => ({ entity: w, tag: tags[w._id] } as EntityAndTag)),
                removes: remove.map(w => ({ entity: w, tag: tags[w._id] } as EntityAndTag)),
                updates: updated.map(w => ({ entity: w, tag: tags[w._id] } as EntityAndTag))
            })));

            return modificationResult.successes_count;
        } catch (e) {
            this._reinitialize();
            throw e;
        }
    }

    private _getTagsForTransaction() {
        const tags = this._tags;
        this._tags = {}
        return tags;
    }

    /**
     * Called before changes are persisted to the database.  Any modificaitons to entities made here will be persisted to the database
     * If you do not want your changes in the database, consider spreading or cloning the entities
     * @param getChanges 
     */
    protected async onBeforeSaveChanges(getChanges: () => { adds: EntityAndTag[], removes: EntityAndTag[], updates: EntityAndTag[] }) {

    }

    protected onAfterSetRev(entity: IIndexableEntity) {

    }

    protected async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[], removes: EntityAndTag[], updates: EntityAndTag[] }) {

    }

    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @returns {DbSetInitializer}
     */
    protected dbset(): DbSetInitializer<TDocumentType, TPluginOptions, TEntityBase> {
        return new DbSetInitializer<TDocumentType, TPluginOptions, TEntityBase>(this.addDbSet.bind(this), this);
    }

    hasPendingChanges() {
        const { add, remove, removeById, updated } = this._getPendingChanges();
        return [add.length, remove.length, removeById.length, updated.length].some(w => w > 0);
    }

    async empty() {

        for (let dbset of this) {
            await dbset.empty();
        }

        await this.saveChanges();
    }

    async destroyDatabase() {
        await this._dbPlugin.destroy()
    }

    async purge(purgeType: "memory" | "disk" = "memory") {

        return null as any;
        // return await this.doWork(async source => {

        //     const options: PouchDB.Configuration.DatabaseConfiguration = {};

        //     if (purgeType === 'memory') {
        //         options.adapter = purgeType;
        //     }

        //     const dbInfo = await source.info();

        //     const temp = new PouchDB('__pdb-ef_purge', options);
        //     const replicationResult = await source.replicate.to(temp, {
        //         filter: doc => {
        //             if (doc._deleted === true) {
        //                 return false
        //             }

        //             return doc;
        //         }
        //     });

        //     if (replicationResult.status !== "complete" || replicationResult.doc_write_failures > 0 || replicationResult.errors.length > 0) {
        //         try {
        //             await temp.destroy();
        //         } catch { } // swallow any potential destroy error
        //         throw new Error(`Could not purge deleted documents.  Reason: ${replicationResult.errors.join('\r\n')}`)
        //     }

        //     // destroy the source database
        //     await source.destroy();
        //     let closeDestination = true;

        //     return await this.doWork(async destination => {
        //         try {
        //             const replicationResult = await temp.replicate.to(destination);

        //             if (replicationResult.status !== "complete" || replicationResult.doc_write_failures > 0 || replicationResult.errors.length > 0) {
        //                 try {
        //                     closeDestination = false;
        //                     await destination.destroy();
        //                 } catch { } // swallow any potential destroy error
        //                 throw new Error(`Could not purge deleted documents.  Reason: ${replicationResult.errors.join('\r\n')}`)
        //             }

        //             return {
        //                 doc_count: replicationResult.docs_written,
        //                 loss_count: Math.abs(dbInfo.doc_count - replicationResult.docs_written)
        //             } as IPurgeResponse;
        //         } catch (e) {
        //             throw e;
        //         }
        //     }, closeDestination)
        // }, false);
    }

    static asUntracked<T extends IDbRecordBase>(...entities: T[]) {
        return entities.map(w => ({ ...w } as T));
    }

    static isProxy(entities: IDbRecordBase) {
        return (entities as IIndexableEntity)[DataContext.PROXY_MARKER] === true;
    }

    static isDate(value: any) {
        return Object.prototype.toString.call(value) === '[object Date]'
    }

    static merge<T extends IDbRecordBase>(to: T, from: T, options?: { skip?: string[]; }) {
        for (let property in from) {

            if (options?.skip && options.skip.includes(property)) {
                continue;
            }

            to[property] = from[property];
        }
    }

    [Symbol.iterator]() {
        let index = -1;
        const data = Object.keys(this.dbSets).map(w => this.dbSets[w]);

        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    }
}