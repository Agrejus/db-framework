import { Changes, DeepPartial, TagsCollection } from "../types/common-types";
import { ContextOptions, IDataContext, IEntityModifications, IProcessedUpdates, OnChangeEvent } from "../types/context-types";
import { DbSetMap, EntityAndTag, IDbSet, IDbSetApi, SaveChangesEventData } from "../types/dbset-types";
import { IDbRecord, IRemovalRecord } from "../types/entity-types";
import { DbSetInitializer } from './dbset/builders/DbSetInitializer';
import { IBulkOperationsResponse, IDbPlugin, IDbPluginOptions } from '../types/plugin-types';
import { ContextChangeTrackingAdapter } from '../adapters/change-tracking/ContextChangeTrackingAdapter';
import { toReadOnlyList } from "../common/helpers";
import { ReadOnlyList } from "../common/ReadOnlyList";
import { DbSetCollection } from "../common/DbSetCollection";
import { Transactions } from "../common/Transactions";
import { MonitoringMixin } from "./monitoring/MonitoringMixin";
import { SaveResult } from "../common/SaveResult";

export abstract class DataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TPluginOptions extends IDbPluginOptions = IDbPluginOptions, TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions> = IDbPlugin<TDocumentType, TEntityBase, TExclusions>> implements IDataContext<TDocumentType, TEntityBase> {

    private _tags: { [id: string]: unknown } = {}

    abstract contextId(): string;

    protected readonly dbPlugin: TDbPlugin;
    protected dbsetMap: DbSetMap = {} as DbSetMap;
    private _onBeforeSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent<TDocumentType, TEntityBase> } = {} as any;
    private _onAfterSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent<TDocumentType, TEntityBase> } = {} as any;
    private readonly _options: TPluginOptions;
    private readonly _contextOptions: ContextOptions;
    private _readonlyDocumentTypes: { [key: string]: true } = {}
    private _changeTracker: ContextChangeTrackingAdapter<TDocumentType, TEntityBase, TExclusions>;

    readonly dbsets = new DbSetCollection(this.dbsetMap);

    get dbName() {
        return this._options.dbName;
    }

    constructor(options: TPluginOptions, Plugin: new (options: TPluginOptions) => TDbPlugin, contextOptions: ContextOptions = { environment: "development" }) {
        this._options = options;
        this._contextOptions = contextOptions;
        this.dbPlugin = new Plugin(options);
        this._changeTracker = new ContextChangeTrackingAdapter();

        MonitoringMixin.register(this.contextId(), this._contextOptions, this, DataContext as any);
    }

    /**
     * Get all documents in the database
     * @returns {Promise<TEntityBase[]>}
     * @deprecated use all() instead
     */
    async getAllDocs() {
        return await this.all();
    }

    /**
     * Gets a DbSet for the matching document type
     * @param documentType 
     * @returns {IDbSet<TDocumentType, TEntityBase, TExclusions>}
     * @deprecated use dbsets.get(documentType) instead
     */
    getDbSet(documentType: TDocumentType) {
        return this.dbsets.get(documentType);
    }

    /**
     * 
     * @returns {IterableIterator<IDbSet<TDocumentType, TEntityBase, TExclusions>>}
     * @deprecated use dbsets.all() instead
     */
    [Symbol.iterator]() {
        let index = -1;
        const data = this.dbsets.all();

        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    }

    clearCache() {
        for (const dbset of this.dbsets.all()) {
            dbset.clearCache();
        }
    }

    async all() {

        const all = await this.dbPlugin.all();

        return this._changeTracker.enrich(all, "deserialize", "defaultRetrieve", "changeTracking", "enhance");
    }

    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    private _getApi() {
        const api: IDbSetApi<TDocumentType, TEntityBase, TExclusions, TDbPlugin> = {
            dbPlugin: this.dbPlugin,
            contextOptions: this._contextOptions,
            tag: this._tag.bind(this),
            registerOnAfterSaveChanges: this._registerOnAfterSaveChanges.bind(this),
            registerOnBeforeSaveChanges: this._registerOnBeforeSaveChanges.bind(this),
            contextId: this.contextId()
        }
        return api;
    }

    private _registerOnBeforeSaveChanges(documentType: TDocumentType, onBeforeSaveChanges: (getChanges: <T extends SaveChangesEventData<TDocumentType, TEntityBase>>() => T) => Promise<void>) {
        this._onBeforeSaveChangesEvents[documentType] = onBeforeSaveChanges;
    }

    private _registerOnAfterSaveChanges(documentType: TDocumentType, onAfterSaveChanges: (getChanges: <T extends SaveChangesEventData<TDocumentType, TEntityBase>>() => T) => Promise<void>) {
        this._onAfterSaveChangesEvents[documentType] = onAfterSaveChanges;
    }

    private _tag(id: string, value: unknown) {
        this._tags[id] = value;
    }

    protected addDbSet(dbset: IDbSet<string, any, any, any>) {

        const info = (dbset as IDbSet<string, any, any, any>).info();

        if (this.dbsetMap[info.DocumentType] != null) {
            throw new Error(`Can only have one DbSet per document type in a context, please create a new context instead`)
        }

        if (info.Readonly === true) {
            this._readonlyDocumentTypes[info.DocumentType] = true;
        }

        this._changeTracker.registerChangeTracker(info.DocumentType as any, info.ChangeTracker as any)

        this.dbsetMap[info.DocumentType] = dbset;
    }

    private _stripUpdatedEntities(updates: ReadOnlyList<TEntityBase>) {
        const docs = updates.all();
        return this._changeTracker.enrich(docs, "strip", "serialize");
    }

    async previewChanges(): Promise<Changes<TDocumentType, TEntityBase>> {
        const { adds, removes, updates } = await this._getModifications();
        const clone = JSON.stringify({
            adds: toReadOnlyList(adds, this.dbPlugin.idPropertyName),
            removes: toReadOnlyList(removes, this.dbPlugin.idPropertyName),
            updates: {
                deltas: toReadOnlyList<DeepPartial<TEntityBase>>(Object.values(updates.deltas), this.dbPlugin.idPropertyName as any),
                docs: toReadOnlyList(Object.values(updates.docs), this.dbPlugin.idPropertyName),
                originals: toReadOnlyList(Object.values(updates.originals), this.dbPlugin.idPropertyName),
            }
        } as Changes<TDocumentType, TEntityBase>);

        const result: Changes<TDocumentType, TEntityBase> = JSON.parse(clone);

        result.updates.docs = toReadOnlyList(this._stripUpdatedEntities(result.updates.docs), this.dbPlugin.idPropertyName);

        return result;
    }

    private async _getModifications() {

        const { adds, removes, removesById, updates, transactions } = this._changeTracker.getPendingChanges();
        const extraRemovalsMap = removesById.reduce((a, v) => {

            if (a[v.DocumentType] == null) {
                a[v.DocumentType] = [];
            }

            a[v.DocumentType].push(v.key)

            return a;
        }, {} as { [key in TDocumentType]: string[] });

        const extraRemovalsByDocumentType = await Promise.all(Object.keys(extraRemovalsMap).map((w: TDocumentType) => this.dbPlugin.getStrict(w, ...extraRemovalsMap[w])));
        const extraRemovals = extraRemovalsByDocumentType.reduce((a, v) => a.concat(v), []);
        const result: IEntityModifications<TDocumentType, TEntityBase> = {
            adds,
            removes: [...removes, ...extraRemovals],
            updates,
            transactions
        };

        return result;
    }

    private _toBeforeSaveChangesEventData(changes: IEntityModifications<TDocumentType, TEntityBase>, tags: { [id: string]: unknown; }, documentType?: TDocumentType) {

        if (documentType == null) {
            return {
                adds: changes.adds.map(w => this._mapChangeToEntityAndTag(w, tags)),
                removes:  changes.removes.map(w => this._mapChangeToEntityAndTag(w, tags)),
                updates: Object.values(changes.updates.docs).map(w => this._mapChangeToEntityAndTag(w, tags))
            }
        }

        return {
            adds: changes.adds.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags)),
            removes:  changes.removes.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags)),
            updates: Object.values(changes.updates.docs).filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags))
        }
    }

    private _mapChangeToEntityAndTag(entity: TEntityBase, tags: { [x: string]: unknown; }): EntityAndTag<TEntityBase> {

        const id = entity[this.dbPlugin.idPropertyName] as string;
        return {
            entity,
            tag: tags[id]
        }
    }

    private _toAfterSaveChangesEventData(adds: TEntityBase[], updates: TEntityBase[], removes: IRemovalRecord<TDocumentType, TEntityBase>[], tags: { [id: string]: unknown; }, documentType?: TDocumentType) {

        if (documentType == null) {
            return {
                adds: adds.map(w => this._mapChangeToEntityAndTag(w, tags)),
                removes:  removes.map(w => this._mapChangeToEntityAndTag(w, tags)),
                updates:  updates.map(w => this._mapChangeToEntityAndTag(w, tags))
            };
        }

        return {
            adds: adds.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags)),
            removes: removes.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags)),
            updates: updates.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags))
        };
    }

    private async _beforeSaveChanges() {

        const beforeOnBeforeSaveChangesTags = this._getTagsForTransaction();
        const beforeSaveChanges = await this._getModifications();

        for (const documentType in this._onBeforeSaveChangesEvents) {
            const event = this._onBeforeSaveChangesEvents[documentType];

            // these need to stay blocking, otherwise we might miss updates that happened
            await event(() => this._toBeforeSaveChangesEventData(beforeSaveChanges, beforeOnBeforeSaveChangesTags, documentType));
        }

        await this.onBeforeSaveChanges(() => this._toBeforeSaveChangesEventData(beforeSaveChanges, beforeOnBeforeSaveChangesTags))

        // get tags again in case more were added in onBeforeSaveChanges
        const afterOnBeforeSaveChangesTags = this._getTagsForTransaction();
        const changes = await this._getModifications();
        const tags = { ...beforeOnBeforeSaveChangesTags, ...afterOnBeforeSaveChangesTags }

        return {
            tags,
            changes
        }
    }

    private async _onAfterSaveChanges(adds: TEntityBase[], updates: TEntityBase[], removes: IRemovalRecord<TDocumentType, TEntityBase>[], tags: TagsCollection) {

        for (const documentType in this._onAfterSaveChangesEvents) {
            const dbset = this.dbsetMap[documentType];

            if (dbset == null || dbset.hasSubscriptions() === false) {
                continue;
            }

            const event = this._onAfterSaveChangesEvents[documentType];

            // only fire if there are subscribers, otherwise we are just needlessly slowing down the save
            setTimeout(() => event(() => this._toAfterSaveChangesEventData(adds, updates, removes, tags, documentType)), 5);
        }

        setTimeout(() => this.onAfterSaveChanges(() => this._toAfterSaveChangesEventData(adds, updates, removes, tags)), 5);
    }

    private _getReadonlyUpdates(updates: IProcessedUpdates<TDocumentType, TEntityBase>) {
        const result: { isEmpty: boolean; data: { [key in TDocumentType]: true } } = { isEmpty: true, data: {} as any };

        for (const id in updates.docs) {
            const doc = updates.docs[id];

            if (!this._readonlyDocumentTypes[doc.DocumentType]) {
                continue;
            }

            result.isEmpty = false;
            result.data[doc.DocumentType] = true;
        }

        return result;
    }

    protected async _preProcessChanges() {
        const { tags, changes } = await this._beforeSaveChanges();
        const { adds, removes, updates, transactions } = changes;
        const updatedItems = Object.values(updates.docs);

        // check for readonly updates, they are not allowed
        if (updatedItems.length > 0) {

            const readonlyUpdateResult = this._getReadonlyUpdates(updates);

            if (readonlyUpdateResult.isEmpty === false) {
                const readonlyDocumentTypes = Object.keys(readonlyUpdateResult.data);
                throw new Error(`Cannot save readonly entities.  Document Types: ${readonlyDocumentTypes.join(', ')}`);
            }
        }

        transactions.appendUpdates(updates);

        return {
            tags,
            transactions,
            adds,
            removes,
            updates: updatedItems,
            processedUpdates: updates
        }
    }

    protected _enrichBeforeSave(data: { adds: TEntityBase[], removes: TEntityBase[], updates: TEntityBase[] }) {
        // strip updates/adds and process removals
        const { adds, removes, updates } = data;

        const strippedAdds = this._changeTracker.enrich(adds, "strip", "serialize");
        const strippedUpdates = this._changeTracker.enrich(updates, "strip", "serialize");
        const formattedRemovals = this._changeTracker.enrich(removes, "remove") as IRemovalRecord<TDocumentType, TEntityBase>[];

        return {
            strippedAdds,
            strippedUpdates,
            formattedRemovals
        }
    }

    protected async _bulkModifications(operations: { adds: TEntityBase[]; removes: TEntityBase[]; updates: TEntityBase[] }, transactions: Transactions) {
        return await this.dbPlugin.bulkOperations(operations, transactions);
    }

    protected _enrichAfterSave(data: { adds: TEntityBase[], updates: TEntityBase[] }, modificationResult: IBulkOperationsResponse) {
        const { adds, updates } = data;

        // map generated values and other enrichments
        const persistedAdds = this._changeTracker.enrichAfterPersisted(adds, modificationResult);
        const persistedUpdates = this._changeTracker.enrichAfterPersisted(updates, modificationResult);

        return {
            persistedAdds,
            persistedUpdates
        }
    }

    protected _convertToSaveResult(data: { adds: TEntityBase[], removes: IRemovalRecord<TDocumentType, TEntityBase>[], updates: TEntityBase[], processedUpdates: IProcessedUpdates<TDocumentType, TEntityBase> }, modificationResult: IBulkOperationsResponse) {

        const { adds, removes, updates, processedUpdates } = data;
        const addsResult = toReadOnlyList(adds, this.dbPlugin.idPropertyName);
        const removesResult = toReadOnlyList(removes, this.dbPlugin.idPropertyName);
        const updatesResult = {
            docs: toReadOnlyList(updates, this.dbPlugin.idPropertyName),
            deltas: toReadOnlyList(Object.values(processedUpdates.deltas), this.dbPlugin.idPropertyName as any),
            originals: toReadOnlyList(Object.values(processedUpdates.originals), this.dbPlugin.idPropertyName)
        }

        return new SaveResult<TDocumentType, TEntityBase>(addsResult, removesResult, updatesResult, modificationResult.successes_count, this.dbPlugin.idPropertyName);
    }

    async saveChanges(): Promise<SaveResult<TDocumentType, TEntityBase>> {
        try {
            const { tags, adds, removes, transactions, updates, processedUpdates } = await this._preProcessChanges()

            // strip updates/adds and process removals
            const { formattedRemovals, strippedAdds, strippedUpdates } = this._enrichBeforeSave({ adds, removes, updates })

            // perform operation on the database
            const modificationResult = await this._bulkModifications({ adds: strippedAdds, removes: formattedRemovals, updates: strippedUpdates }, transactions);

            const { persistedAdds, persistedUpdates } = this._enrichAfterSave({ adds: strippedAdds, updates: strippedUpdates }, modificationResult);

            this._changeTracker.reinitialize(formattedRemovals, persistedAdds, persistedUpdates);

            const result = this._convertToSaveResult({ adds: persistedAdds, removes: formattedRemovals, updates: persistedUpdates, processedUpdates }, modificationResult);

            this._clearCaches(result);

            await this._onAfterSaveChanges(persistedAdds, persistedUpdates, formattedRemovals, tags);

            return result;
        } catch (e: any) {
            this._changeTracker.reinitialize();

            await this.onSaveError(e);

            throw e;
        }
    }

    protected _clearCaches(saveResult: SaveResult<TDocumentType, TEntityBase>) {

        // we need to bust the caches here... do we bust by document type or filter down and only busy if it has changed?
        // we can cache the filter function and then check for adds/updates
        // always bust on removes
        const { adds, removes, updates } = saveResult;

        for (const dbset of this.dbsets.all()) {
            const info = dbset.info();
            const documentType = info.DocumentType;

            if (removes.hasDocumentType(documentType) || adds.hasDocumentType(documentType) || updates.docs.hasDocumentType(documentType)) {
                dbset.clearCache();
            }

        }
    }

    protected async onSaveError(error: any) {

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
    protected async onBeforeSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>) {

    }

    protected async onAfterSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>) {

    }

    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     */
    protected dbset(): DbSetInitializer<TDocumentType, TEntityBase, TExclusions, TPluginOptions, TDbPlugin> {
        return new DbSetInitializer<TDocumentType, TEntityBase, TExclusions, TPluginOptions, TDbPlugin>(this.addDbSet.bind(this), this);
    }

    hasPendingChanges() {
        const { adds, removes, removesById, updates } = this._changeTracker.getPendingChanges();
        return [adds.length, removes.length, removesById.length, Object.values(updates.docs).length].some(w => w > 0);
    }

    async empty() {
        for (let dbset of this.dbsets.all()) {
            await dbset.empty();
        }
    }

    async destroyDatabase() {
        await this.dbPlugin.destroy()
    }

    asUntracked(...entities: TEntityBase[]) {
        return this._changeTracker.asUntracked(...entities);
    }

    static isDate(value: any) {
        return Object.prototype.toString.call(value) === '[object Date]'
    }

    static isObject(item: any) {
        return item && typeof item === 'object' && Array.isArray(item) === false;
    }

    static mergeDeep(destination: any, source: any) {
        if (DataContext.isObject(destination) && DataContext.isObject(source)) {
            for (const key in source) {
                if (DataContext.isObject(source[key])) {

                    if (!destination[key]) {
                        destination[key] = {}
                    }

                    DataContext.mergeDeep(destination[key], source[key]);
                } else {
                    destination[key] = source[key]
                }
            }
        }

        return destination;
    }
}