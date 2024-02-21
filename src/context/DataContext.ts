import { Changes, DeepPartial, SaveResult } from "../types/common-types";
import { ContextOptions, IDataContext, OnChangeEvent } from "../types/context-types";
import { DbSetMap, EntityAndTag, IDbSet, IDbSetApi, SaveChangesEventData } from "../types/dbset-types";
import { IDbRecord, IRemovalRecord } from "../types/entity-types";
import { DbSetInitializer } from './dbset/builders/DbSetInitializer';
import { DbPluginInstanceCreator, IDbPlugin, IDbPluginOptions } from '../types/plugin-types';
import { ContextChangeTrackingAdapter } from '../adapters/change-tracking/ContextChangeTrackingAdapter';
import { toReadOnlyList } from "../common/helpers";
import { ReadOnlyList } from "../common/ReadOnlyList";

export abstract class DataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TPluginOptions extends IDbPluginOptions = IDbPluginOptions, TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions> = IDbPlugin<TDocumentType, TEntityBase, TExclusions>> implements IDataContext<TDocumentType, TEntityBase> {

    private _tags: { [id: string]: unknown } = {}

    abstract contextId(): string;

    protected readonly dbPlugin: TDbPlugin;
    protected dbSets: DbSetMap = {} as DbSetMap;
    private _onBeforeSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent<TDocumentType, TEntityBase> } = {} as any;
    private _onAfterSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent<TDocumentType, TEntityBase> } = {} as any;
    private readonly _options: TPluginOptions;
    private readonly _contextOptions: ContextOptions;
    private _readonlyDocumentTypes: { [key: string]: true } = {}
    private _changeTracker: ContextChangeTrackingAdapter<TDocumentType, TEntityBase, TExclusions>;

    get dbName() {
        return this._options.dbName;
    }

    constructor(options: TPluginOptions, Plugin: DbPluginInstanceCreator<TDocumentType, TEntityBase, TExclusions, TDbPlugin>, contextOptions: ContextOptions = { environment: "development" }) {
        this._options = options;
        this._contextOptions = contextOptions;
        this.dbPlugin = new Plugin(options);
        this._changeTracker = new ContextChangeTrackingAdapter();
    }

    async getAllDocs() {

        const all = await this.dbPlugin.all();

        return this._changeTracker.composeAndRunEnrichment(all, "deserialize", "defaultRetrieve", "changeTracking", "enhance");
    }

    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    private _getApi() {
        const api: IDbSetApi<TDocumentType, TEntityBase, TExclusions> = {
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

    protected addDbSet(dbset: IDbSet<string, any, any>) {

        const info = (dbset as IDbSet<string, any, any>).info();

        if (this.dbSets[info.DocumentType] != null) {
            throw new Error(`Can only have one DbSet per document type in a context, please create a new context instead`)
        }

        if (info.Readonly === true) {
            this._readonlyDocumentTypes[info.DocumentType] = true;
        }

        this._changeTracker.registerChangeTracker(info.DocumentType as any, info.ChangeTracker as any)

        this.dbSets[info.DocumentType] = dbset;
    }

    private _stripUpdatedEntities(updates: ReadOnlyList<TEntityBase>) {
        const docs = updates.all();
        return this._changeTracker.composeAndRunEnrichment(docs, "strip", "serialize");
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

        return {
            adds,
            removes: [...removes, ...extraRemovals],
            updates,
            transactions
        }
    }

    private async _beforeSaveChanges() {

        const beforeOnBeforeSaveChangesTags = this._getTagsForTransaction();
        const beforeSaveChanges = await this._getModifications();

        for (const documentType in this._onBeforeSaveChangesEvents) {
            const event = this._onBeforeSaveChangesEvents[documentType];
            await event(() => ({
                adds: beforeSaveChanges.adds.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags)),
                removes: beforeSaveChanges.removes.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags)),
                updates: Object.values(beforeSaveChanges.updates.docs).filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags))
            }))
        }

        // Devs are allowed to modify data/add data in onBeforeSaveChanges.  Useful for
        // creating history dbset that tracks changes in another dbset
        await this.onBeforeSaveChanges(() => ({
            adds: beforeSaveChanges.adds.map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags)),
            removes: beforeSaveChanges.removes.map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags)),
            updates: Object.values(beforeSaveChanges.updates.docs).map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags))
        }))

        // get tags again in case more were added in onBeforeSaveChanges
        const afterOnBeforeSaveChangesTags = this._getTagsForTransaction();
        const changes = await this._getModifications();
        const tags = { ...beforeOnBeforeSaveChangesTags, ...afterOnBeforeSaveChangesTags }

        return {
            tags,
            changes
        }
    }

    async saveChanges(): Promise<SaveResult<TDocumentType, TEntityBase>> {
        try {
            const { tags, changes } = await this._beforeSaveChanges();
            const { adds, removes, updates, transactions } = changes;
            const updatedItems = Object.values(updates.docs);

            // check for readonly updates, they are not allowed
            if (updatedItems.length > 0) {
                const readonlyDocumentTypes = Object.keys(updatedItems.filter(w => this._readonlyDocumentTypes[w.DocumentType] === true).reduce((a, v) => ({ ...a, [v.DocumentType]: v.DocumentType }), {} as { [key: string]: string }));

                if (readonlyDocumentTypes.length > 0) {
                    throw new Error(`Cannot save readonly entities.  Document Types: ${readonlyDocumentTypes.join(', ')}`)
                }
            }

            // strip updates/adds and process removals
            const strippedAdds = this._changeTracker.composeAndRunEnrichment(adds, "strip", "serialize");
            const strippedUpdates = this._changeTracker.composeAndRunEnrichment(updatedItems, "strip", "serialize");
            const formattedRemovals = this._changeTracker.composeAndRunEnrichment(removes, "remove") as IRemovalRecord<TDocumentType, TEntityBase>[];

            transactions.appendUpdates(updates);

            // perform operation on the database
            const modificationResult = await this.dbPlugin.bulkOperations({ adds: strippedAdds, removes: formattedRemovals, updates: strippedUpdates }, transactions);

            this._changeTracker.composeAndRunEnrichmentAfterPersisted(strippedAdds, modificationResult)
            // map generated values and other enrichments
            const persistedAdds = this._changeTracker.composeAndRunEnrichmentAfterPersisted(strippedAdds, modificationResult);
            const persistedUpdates = this._changeTracker.composeAndRunEnrichmentAfterPersisted(strippedUpdates, modificationResult);

            this._changeTracker.reinitialize(formattedRemovals, persistedAdds, persistedUpdates);

            const result: SaveResult<TDocumentType, TEntityBase> = {
                adds: toReadOnlyList(persistedAdds, this.dbPlugin.idPropertyName),
                removes: toReadOnlyList(formattedRemovals, this.dbPlugin.idPropertyName),
                updates: {
                    docs: toReadOnlyList(persistedUpdates, this.dbPlugin.idPropertyName),
                    deltas: toReadOnlyList(Object.values(updates.deltas), this.dbPlugin.idPropertyName as any),
                    originals: toReadOnlyList(Object.values(updates.originals), this.dbPlugin.idPropertyName)
                },
                successes_count: modificationResult.successes_count
            }

            await this._onAfterSaveChanges(persistedAdds, persistedUpdates, formattedRemovals, tags);


            return result;
        } catch (e: any) {
            this._changeTracker.reinitialize();

            await this.onSaveError(e);

            throw e;
        }
    }

    protected async onSaveError(error: any) {

    }

    private _mapChangeToEntityAndTag(entity: TEntityBase, tags: { [x: string]: unknown; }): EntityAndTag<TEntityBase> {

        const id = entity[this.dbPlugin.idPropertyName] as string;
        return {
            entity,
            tag: tags[id]
        }
    }

    private async _onAfterSaveChanges(adds: TEntityBase[], updates: TEntityBase[], removes: IRemovalRecord<TDocumentType, TEntityBase>[], tags: { [x: string]: unknown; }) {

        for (const documentType in this._onAfterSaveChangesEvents) {
            const event = this._onAfterSaveChangesEvents[documentType];
            await event(() => JSON.parse(JSON.stringify({
                adds: adds.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags)),
                removes: removes.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags)),
                updates: Object.values(updates).filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags))
            })))
        }

        await this.onAfterSaveChanges(() => JSON.parse(JSON.stringify({
            adds: adds.map(w => this._mapChangeToEntityAndTag(w, tags)),
            removes: removes.map(w => this._mapChangeToEntityAndTag(w, tags)),
            updates: Object.values(updates).map(w => this._mapChangeToEntityAndTag(w, tags))
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
    protected async onBeforeSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>) {

    }

    protected async onAfterSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>) {

    }

    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     */
    protected dbset(): DbSetInitializer<TDocumentType, TEntityBase, TExclusions, TPluginOptions> {
        return new DbSetInitializer<TDocumentType, TEntityBase, TExclusions, TPluginOptions>(this.addDbSet.bind(this), this);
    }

    hasPendingChanges() {
        const { adds, removes, removesById, updates } = this._changeTracker.getPendingChanges();
        return [adds.length, removes.length, removesById.length, Object.values(updates.docs).length].some(w => w > 0);
    }

    async empty() {
        for (let dbset of this) {
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

    getDbSet(documentType: TDocumentType) {
        return this.dbSets[documentType];
    }

    [Symbol.iterator]() {
        let index = -1;
        const data = Object.keys(this.dbSets).map(w => this.dbSets[w]);

        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    }
}