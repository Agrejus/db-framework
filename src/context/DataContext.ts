import { IPreviewChanges } from "../types/common-types";
import { ContextOptions, IDataContext, OnChangeEvent } from "../types/context-types";
import { DbSetMap, EntityAndTag, IDbSet, IStatefulDbSet, SaveChangesEventData } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";
import { DbSetInitializer } from './dbset/builders/DbSetInitializer';
import { DbPluginInstanceCreator, IDbPlugin, IDbPluginOptions } from '../types/plugin-types';
import { ChangeTrackingAdapterBase } from '../adapters/change-tracking/ChangeTrackingAdapterBase';
import { EntityChangeTrackingAdapter } from '../adapters/change-tracking/EntityChangeTrackingAdapter';
import { ContextChangeTrackingAdapter } from '../adapters/change-tracking/ContextChangeTrackingAdapter';

export class DataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TPluginOptions extends IDbPluginOptions = IDbPluginOptions, TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions> = IDbPlugin<TDocumentType, TEntityBase, TExclusions>> implements IDataContext<TDocumentType, TEntityBase> {

    private _tags: { [id: string]: unknown } = {}

    protected readonly dbPlugin: TDbPlugin;
    protected dbSets: DbSetMap = {} as DbSetMap;
    private _onBeforeSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent<TDocumentType, TEntityBase> } = {} as any;
    private _onAfterSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent<TDocumentType, TEntityBase> } = {} as any;
    private readonly _changeAdapter: ChangeTrackingAdapterBase<TDocumentType, TEntityBase, typeof this.dbPlugin.types.exclusions>;
    private readonly _options: TPluginOptions;

    get dbName() {
        return this._options.dbName;
    }

    constructor(options: TPluginOptions, Plugin: DbPluginInstanceCreator<TDocumentType, TEntityBase, TExclusions, TDbPlugin>, contextOptions: ContextOptions = { changeTrackingType: "entity", environment: "development" }) {
        this._options = options;
        this.dbPlugin = new Plugin(options);

        if (contextOptions.changeTrackingType === "entity") {
            this._changeAdapter = new EntityChangeTrackingAdapter<TDocumentType, TEntityBase, typeof this.dbPlugin.types.exclusions>(this.dbPlugin.idPropertName, contextOptions.environment);
            return;
        }

        this._changeAdapter = new ContextChangeTrackingAdapter<TDocumentType, TEntityBase, typeof this.dbPlugin.types.exclusions>(this.dbPlugin.idPropertName, contextOptions.environment);
    }

    async getAllDocs() {

        const all = await this.dbPlugin.all();

        return all.map(w => {

            const dbSet = this.dbSets[w.DocumentType] as (IDbSet<TDocumentType, TEntityBase, any> | undefined);

            if (dbSet) {
                const info = dbSet.info();

                return this._changeAdapter.enableChangeTracking(w, info.Defaults.retrieve, info.Readonly, info.Map)
            }

            return w
        });
    }

    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    private _getApi() {
        return {
            dbPlugin: this.dbPlugin,
            changeTrackingAdapter: this._changeAdapter,
            tag: this._tag.bind(this),
            registerOnAfterSaveChanges: this._registerOnAfterSaveChanges.bind(this),
            registerOnBeforeSaveChanges: this._registerOnBeforeSaveChanges.bind(this)
        }
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

    protected addDbSet(dbset: IDbSet<string, any>) {

        const info = (dbset as IDbSet<any, any, any>).info();

        if (this.dbSets[info.DocumentType] != null) {
            throw new Error(`Can only have one DbSet per document type in a context, please create a new context instead`)
        }

        this.dbSets[info.DocumentType] = dbset;
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

    private async _getModifications() {
        const changes = this._changeAdapter.getTrackedData();
        const { add, remove, removeById, updated } = this._changeAdapter.getPendingChanges(changes, this.dbSets);

        const extraRemovals = await this.dbPlugin.getStrict(...removeById);
        const formattedDeletions = this.dbPlugin.formatDeletions(...remove, ...extraRemovals)

        return {
            add,
            remove: formattedDeletions,
            updated
        }
    }

    private async _beforeSaveChanges() {
        const beforeOnBeforeSaveChangesTags = this._getTagsForTransaction();
        const beforeSaveChanges = await this._getModifications();

        for (const documentType in this._onBeforeSaveChangesEvents) {
            const event = this._onBeforeSaveChangesEvents[documentType];
            await event(() => ({
                adds: beforeSaveChanges.add.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags)),
                removes: beforeSaveChanges.remove.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags)),
                updates: beforeSaveChanges.updated.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags))
            }))
        }

        // Devs are allowed to modify data/add data in onBeforeSaveChanges.  Useful for
        // creating history dbset that tracks changes in another dbset
        await this.onBeforeSaveChanges(() => ({
            adds: beforeSaveChanges.add.map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags)),
            removes: beforeSaveChanges.remove.map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags)),
            updates: beforeSaveChanges.updated.map(w => this._mapChangeToEntityAndTag(w, beforeOnBeforeSaveChangesTags))
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
            this._changeAdapter.makePristine(...modifications);

            const modificationResult = await this.dbPlugin.bulkOperations({ adds: add, removes: remove, updates: updated });

            // set any properties return from the database
            this.dbPlugin.setDbGeneratedValues(modificationResult, modifications);

            // make pristine again because we potentially set properties above
            this._changeAdapter.makePristine(...modifications);
            this._changeAdapter.reinitialize(remove, add, updated);

            await this._onAfterSaveChanges(changes, tags);

            return modificationResult.successes_count;
        } catch (e: any) {
            this._changeAdapter.reinitialize();

            // rehydrate on error so we can ensure the store matches
            await this.onSaveError(e);

            throw e;
        }
    }

    protected async onSaveError(error: any) {

    }

    private _mapChangeToEntityAndTag(entity: TEntityBase, tags: { [x: string]: unknown; }): EntityAndTag<TEntityBase> {

        const id = entity[this.dbPlugin.idPropertName] as string;
        return {
            entity,
            tag: tags[id]
        }
    }

    private async _onAfterSaveChanges(changes: { add: TEntityBase[]; remove: TEntityBase[]; updated: TEntityBase[]; }, tags: { [x: string]: unknown; }) {

        const { add, remove, updated } = changes;

        for (const documentType in this._onAfterSaveChangesEvents) {
            const event = this._onAfterSaveChangesEvents[documentType];
            await event(() => JSON.parse(JSON.stringify({
                adds: add.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags)),
                removes: remove.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags)),
                updates: updated.filter(w => w.DocumentType === documentType).map(w => this._mapChangeToEntityAndTag(w, tags))
            })))
        }

        await this.onAfterSaveChanges(() => JSON.parse(JSON.stringify({
            adds: add.map(w => this._mapChangeToEntityAndTag(w, tags)),
            removes: remove.map(w => this._mapChangeToEntityAndTag(w, tags)),
            updates: updated.map(w => this._mapChangeToEntityAndTag(w, tags))
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
     * @returns {DbSetInitializer}
     */
    protected dbset(): DbSetInitializer<TDocumentType, TEntityBase, TExclusions, TPluginOptions> {
        return new DbSetInitializer<TDocumentType, TEntityBase, TExclusions, TPluginOptions>(this.addDbSet.bind(this), this);
    }

    hasPendingChanges() {
        const changes = this._changeAdapter.getTrackedData();
        const { add, remove, removeById, updated } = this._changeAdapter.getPendingChanges(changes, this.dbSets);
        return [add.length, remove.length, removeById.length, updated.length].some(w => w > 0);
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
        return this._changeAdapter.asUntracked(...entities);
    }

    static isDate(value: any) {
        return Object.prototype.toString.call(value) === '[object Date]'
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