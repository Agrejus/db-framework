import { AdvancedDictionary } from "../common/AdvancedDictionary";
import { DeepPartial, IPreviewChanges } from "../types/common-types";
import { IDataContext, ITrackedData, OnChangeEvent } from "../types/context-types";
import { EntityAndTag, IDbSet, IDbSetApi } from "../types/dbset-types";
import { IDbRecordBase, OmittedEntity, IIndexableEntity, SplitDocumentDocumentPropertyName, SplitDocumentPathPropertyName, IDbRecord } from "../types/entity-types";
import { PropertyMap } from '../types/dbset-builder-types';
import { DbSetInitializer } from './dbset/builders/DbSetInitializer';
import { DbPluginInstanceCreator, IDbPlugin, IDbPluginOptions } from '../types/plugin-types';


export class DataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TPluginOptions extends IDbPluginOptions = IDbPluginOptions> implements IDataContext<TDocumentType, TEntityBase> {

    protected readonly PRISTINE_ENTITY_KEY = "__pristine_entity__";
    protected readonly DIRTY_ENTITY_MARKER = "__isDirty";
    static PROXY_MARKER: string = '__isProxy';

    protected _removals: TEntityBase[] = [];
    protected _additions: TEntityBase[] = [];
    protected _attachments: AdvancedDictionary<TEntityBase> = new AdvancedDictionary<TEntityBase>("_id");
    private _tags: { [id: string]: unknown } = {}

    protected _removeById: string[] = [];
    protected readonly dbPlugin: IDbPlugin<TDocumentType, TEntityBase>;
    protected dbSets: { [key: string]: IDbSet<string, any> } = {} as { [key: string]: IDbSet<string, any> };
    private _onBeforeSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent } = {} as any;
    private _onAfterSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent } = {} as any

    constructor(options: TPluginOptions, Plugin: DbPluginInstanceCreator<TDocumentType, TEntityBase>) {
        this.dbPlugin = new Plugin(options);
    }

    async getAllDocs() {

        const all = await this.dbPlugin.all();

        return all.map(w => {

            const dbSet = this.dbSets[w.DocumentType] as (IDbSet<TDocumentType, TEntityBase, any> | undefined);

            if (dbSet) {
                const info = dbSet.info();

                return this._makeTrackable(w, info.Defaults.retrieve, info.Readonly, info.Map)
            }

            return w
        });
    }

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
            plugin: this.dbPlugin,
            send: this._sendData.bind(this),
            detach: this._detach.bind(this),
            makeTrackable: this._makeTrackable.bind(this),
            map: this._mapAndSetDefaults.bind(this),
            DIRTY_ENTITY_MARKER: this.DIRTY_ENTITY_MARKER,
            PRISTINE_ENTITY_KEY: this.PRISTINE_ENTITY_KEY,
            makePristine: this._makePristine.bind(this),
            tag: this._tag.bind(this),
            registerOnAfterSaveChanges: this._registerOnAfterSaveChanges.bind(this),
            registerOnBeforeSaveChanges: this._registerOnBeforeSaveChanges.bind(this)
        }
    }

    private _registerOnBeforeSaveChanges(documentType: TDocumentType, onBeforeSaveChanges: (getChanges: () => { adds: EntityAndTag[], removes: EntityAndTag[], updates: EntityAndTag[] }) => Promise<void>) {
        this._onBeforeSaveChangesEvents[documentType] = onBeforeSaveChanges;
    }

    private _registerOnAfterSaveChanges(documentType: TDocumentType, onAfterSaveChanges: (getChanges: () => { adds: EntityAndTag[], removes: EntityAndTag[], updates: EntityAndTag[] }) => Promise<void>) {
        this._onAfterSaveChangesEvents[documentType] = onAfterSaveChanges;
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

        const extraRemovals = await this.dbPlugin.getStrict(...removeById);

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

        for (const documentType in this._onBeforeSaveChangesEvents) {
            const event = this._onBeforeSaveChangesEvents[documentType];
            await event(() => ({
                adds: beforeSaveChanges.add.filter(w => w.DocumentType === documentType).map(w => ({ entity: w, tag: beforeOnBeforeSaveChangesTags[w._id] } as EntityAndTag<TEntityBase>)),
                removes: beforeSaveChanges.remove.filter(w => w.DocumentType === documentType).map(w => ({ entity: w, tag: beforeOnBeforeSaveChangesTags[w._id] } as EntityAndTag<TEntityBase>)),
                updates: beforeSaveChanges.updated.filter(w => w.DocumentType === documentType).map(w => ({ entity: w, tag: beforeOnBeforeSaveChangesTags[w._id] } as EntityAndTag<TEntityBase>))
            }))
        }

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

            const modificationResult = await this.dbPlugin.bulkOperations({ adds: add, removes: remove, updates: updated });

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

            await this._onAfterSaveChanges(changes, tags);

            return modificationResult.successes_count;
        } catch (e) {
            this._reinitialize();
            throw e;
        }
    }

    private async _onAfterSaveChanges(changes: { add: TEntityBase[]; remove: TEntityBase[]; updated: TEntityBase[]; }, tags: { [x: string]: unknown; }) {

        const { add, remove, updated } = changes;

        for (const documentType in this._onAfterSaveChangesEvents) {
            const event = this._onAfterSaveChangesEvents[documentType];
            await event(() => JSON.parse(JSON.stringify({
                adds: add.filter(w => w.DocumentType === documentType).map(w => ({ entity: w, tag: tags[w._id] } as EntityAndTag)),
                removes: remove.filter(w => w.DocumentType === documentType).map(w => ({ entity: w, tag: tags[w._id] } as EntityAndTag)),
                updates: updated.filter(w => w.DocumentType === documentType).map(w => ({ entity: w, tag: tags[w._id] } as EntityAndTag))
            })))
        }

        await this.onAfterSaveChanges(() => JSON.parse(JSON.stringify({
            adds: add.map(w => ({ entity: w, tag: tags[w._id] } as EntityAndTag)),
            removes: remove.map(w => ({ entity: w, tag: tags[w._id] } as EntityAndTag)),
            updates: updated.map(w => ({ entity: w, tag: tags[w._id] } as EntityAndTag))
        })));
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
    protected dbset(): DbSetInitializer<TDocumentType, TEntityBase, TPluginOptions> {
        return new DbSetInitializer<TDocumentType, TEntityBase, TPluginOptions>(this.addDbSet.bind(this), this);
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
        await this.dbPlugin.destroy()
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

    getDbSet<T extends string, E extends IDbRecord<T>, EE extends string = never>(documentType: T): IDbSet<T, E, EE> | undefined {
        return this.dbSets[documentType] as IDbSet<T, E, EE>
    }

    [Symbol.iterator]() {
        let index = -1;
        const data = Object.keys(this.dbSets).map(w => this.dbSets[w]);

        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    }
}