import { IPreviewChanges } from "../types/common-types";
import { ContextOptions, IDataContext, OnChangeEvent } from "../types/context-types";
import { DbSetMap, EntityAndTag, IDbSet, IDbSetApi, IStoreDbSet } from "../types/dbset-types";
import { IIndexableEntity, IDbRecord } from "../types/entity-types";
import { DbSetInitializer } from './dbset/builders/DbSetInitializer';
import { DbPluginInstanceCreator, IDbPlugin, IDbPluginOptions } from '../types/plugin-types';
import { ChangeTrackingAdapterBase } from '../adapters/change-tracking/ChangeTrackingAdapterBase';
import { EntityChangeTrackingAdapter } from '../adapters/change-tracking/EntityChangeTrackingAdapter';
import { ContextChangeTrackingAdapter } from '../adapters/change-tracking/ContextChangeTrackingAdapter';

export abstract class DataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TPluginOptions extends IDbPluginOptions = IDbPluginOptions, TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase> = IDbPlugin<TDocumentType, TEntityBase>> implements IDataContext<TDocumentType, TEntityBase> {

    private _tags: { [id: string]: unknown } = {}

    protected readonly dbPlugin: TDbPlugin;
    protected dbSets: DbSetMap = {} as DbSetMap;
    private _onBeforeSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent } = {} as any;
    private _onAfterSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent } = {} as any;
    private readonly _changeAdapter: ChangeTrackingAdapterBase<TDocumentType, TEntityBase>;

    constructor(options: TPluginOptions, Plugin: DbPluginInstanceCreator<TDocumentType, TEntityBase, TDbPlugin>, contextOptions: ContextOptions = { changeTrackingType: "entity" }) {
        this.dbPlugin = new Plugin(options);

        if (contextOptions.changeTrackingType === "entity") {
            this._changeAdapter = new EntityChangeTrackingAdapter();
            return;
        }

        this._changeAdapter = new ContextChangeTrackingAdapter();
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
     * Gets an instance of IDataContext to be used with DbSets
     */
    protected getContext() { return this; }

    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    private _getApi(): IDbSetApi<TDocumentType, TEntityBase> {
        return {
            dbPlugin: this.dbPlugin,
            changeTrackingAdapter: this._changeAdapter,
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

        return {
            add,
            remove: [...remove, ...extraRemovals].map(w => {

                let result = { ...w, _id: w._id, _rev: w._rev, DocumentType: w.DocumentType, _deleted: true } as IIndexableEntity;

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
            this._changeAdapter.makePristine(...modifications);

            // can we just skip over memory here?

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
                    this._changeAdapter.makePristine(modification);
                }
            }

            this._changeAdapter.reinitialize(remove, add, updated);

            await this._onAfterSaveChanges(changes, tags);

            return modificationResult.successes_count;
        } catch (e) {
            this._changeAdapter.reinitialize();

            // rehydrate on error so we can ensure the store matches
            await this._rehydrate();

            throw e;
        }
    }

    private async _rehydrate() {
        const dbsets: IStoreDbSet<TDocumentType, any>[] = [];
        for (const dbset of this) {
            if (dbset.types.dbsetType === "store") {
                dbsets.push(dbset as IStoreDbSet<TDocumentType, any>);
                continue;
            }
        }

        await Promise.all(dbsets.map(w => w.hydrate()))
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
        const changes = this._changeAdapter.getTrackedData();
        const { add, remove, removeById, updated } = this._changeAdapter.getPendingChanges(changes, this.dbSets);
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