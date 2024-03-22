import { AdapterFactory } from '../../adapters/AdapterFactory';
import { IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetModificationAdapter } from '../../types/adapter-types';
import { EntitySelector } from '../../types/common-types';
import { IDbSetProps, DbSetType, DbSetSubscriptionCallback, IDbSet, DbSetCacheConfiguration, DbSetTtlCacheConfiguration } from '../../types/dbset-types';
import { IDbRecord, OmittedEntity, IDbRecordBase } from '../../types/entity-types';
import { ChangeTrackingFactory } from '../../adapters/change-tracking/ChangeTrackingFactory';
import { ContextOptions, IPrivateContext } from '../../types/context-types';
import { IDbSetChangeTracker } from '../../types/change-tracking-types';
import { MonitoringMixin } from '../monitoring/MonitoringMixin';
import { IDbPlugin } from '../../types/plugin-types';

/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> implements IDbSet<TDocumentType, TEntity, TExclusions, TDbPlugin> {

    protected readonly _fetchAdapter: IDbSetFetchAdapter<TEntity["DocumentType"], TEntity, TExclusions>;
    protected readonly _generalAdapter: IDbSetGeneralAdapter<TEntity["DocumentType"], TEntity, TExclusions>;
    protected readonly _modificationAdapter: IDbSetModificationAdapter<TEntity["DocumentType"], TEntity, TExclusions>;
    readonly dbPlugin: TDbPlugin;
    readonly changeTracker: IDbSetChangeTracker<TEntity["DocumentType"], TEntity, TExclusions>;
    private readonly _documentType: TEntity["DocumentType"];
    private readonly _contextOptions: ContextOptions;

    protected getDbSetType(): DbSetType {
        return "default";
    }

    get types() {
        return {
            modify: {} as OmittedEntity<TEntity, TExclusions>,
            result: {} as TEntity,
            documentType: {} as TEntity["DocumentType"],
            map: {} as { [DocumentType in TEntity["DocumentType"]]: TEntity },
            dbsetType: this.getDbSetType()
        }
    }

    hasSubscriptions() {
        return this._modificationAdapter.hasSubscriptions();
    }

    /**
     * Constructor
     * @param props Properties for the constructor
     */
    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>) {

        const context = props.context as IPrivateContext<TDocumentType, TEntity, TExclusions, TDbPlugin>;

        const api = context._getApi();
        this.dbPlugin = api.dbPlugin;
        this._contextOptions = api.contextOptions;
        this._documentType = props.documentType;
        const dbPlugin = api.dbPlugin as IDbPlugin<TDocumentType, TEntity, TExclusions>;

        const changeTrackingFactory = new ChangeTrackingFactory<TDocumentType, TEntity, TExclusions, TDbPlugin>(props, this.dbPlugin, api.contextId, api.contextOptions.environment ?? "development");

        this.changeTracker = changeTrackingFactory.getTracker();

        const adapterFactory = new AdapterFactory<TDocumentType, TEntity, TExclusions, TDbPlugin>(props, this.types.dbsetType, dbPlugin.idPropertyName, this.changeTracker);

        this._fetchAdapter = adapterFactory.createFetchMediator();
        this._generalAdapter = adapterFactory.createGeneralAdapter();
        this._modificationAdapter = adapterFactory.createModificationAdapter();

        MonitoringMixin.register(`DbSet:${props.documentType}`, api.contextOptions, this, DbSet as any);
    }

    registerMonitoringMixin(instance: any, ...methodNames: string[]) {
        // when we extend a dbset, we need to add the function to the monitoring mixin
        MonitoringMixin.register(`DbSet:${this._documentType}`, this._contextOptions, instance, DbSet as any, methodNames);
    }

    useCache(configuration: DbSetCacheConfiguration | DbSetTtlCacheConfiguration) {
        this._fetchAdapter.useCache(configuration);
        return this;
    }

    clearCache(...keys: string[]) {
        this._fetchAdapter.clearCache(...keys);
    }

    info() {
        return this._generalAdapter.info();
    }

    tag(value: unknown) {
        this._modificationAdapter.tag(value);
        return this;
    }

    instance(...entities: OmittedEntity<TEntity, TExclusions>[]) {
        return this._modificationAdapter.instance(...entities);
    }

    async add(...entities: OmittedEntity<TEntity, TExclusions>[]) {
        return await this._modificationAdapter.add(...entities);
    }

    async upsert(...entities: (OmittedEntity<TEntity, TExclusions> | Omit<TEntity, "DocumentType">)[]) {
        return await this._modificationAdapter.upsert(...entities);
    }

    async remove(...ids: string[]): Promise<void>;
    async remove(...entities: TEntity[]): Promise<void>;
    async remove(...entities: any[]) {
        return await this._modificationAdapter.remove(...entities);
    }

    async empty() {
        await this._modificationAdapter.empty();
    }

    async all() {
        const result = await this._fetchAdapter.all();

        const trackedData = result.toTrackable();
        return await trackedData.toAttached();
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        const result = await this._fetchAdapter.filter(selector);

        const trackedData = result.toTrackable();
        return await trackedData.toAttached();
    }

    async get(...ids: string[]) {
        const result = await this._fetchAdapter.getStrict(...ids);

        const trackedData = result.toTrackable();
        return await trackedData.toAttached();
    }

    async find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined> {
        const result = await this._fetchAdapter.find(selector);

        if (result == null) {
            return undefined;
        }

        const trackedData = result.toTrackable();
        const [attached] = await trackedData.toAttached();
        return attached;
    }

    async first() {
        const result = await this._fetchAdapter.first();

        if (result == null) {
            return undefined;
        }

        const trackedData = result.toTrackable();
        const [attached] = await trackedData.toAttached();
        return attached;
    }

    async pluck<TKey extends keyof TEntity>(selector: EntitySelector<TDocumentType, TEntity>, propertySelector: TKey) {
        return await this._fetchAdapter.pluck(selector, propertySelector);
    }

    unlink(...entities: TEntity[]): void
    unlink(...ids: (keyof TEntity)[]): void
    unlink(...items: any[]) {
        this._generalAdapter.unlink(...items);
    }

    async markDirty(...entities: TEntity[]) {
        return await this._generalAdapter.markDirty(...entities);
    }

    async link(...entities: TEntity[]) {
        return await this._generalAdapter.link(...entities);
    }

    linkUnsafe(...entities: TEntity[]) {
        return this._generalAdapter.linkUnsafe(...entities);
    }

    isLinked(entity: TEntity) {
        return this._generalAdapter.isLinked(entity);
    }

    subscribe(callback: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>): () => void;
    subscribe(selector: EntitySelector<TDocumentType, TEntity>, callback: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>): () => void;
    subscribe(selectorOrCallback: EntitySelector<TDocumentType, TEntity> | DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>, callback?: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>) {
        return this._modificationAdapter.subscribe(selectorOrCallback, callback);
    }


    // async replace(...entities: TEntity[]) {
    //     return await this._modificationAdapter.replace(...entities);
    // }

    
    isMatch(first: TEntity, second: any) {
        return this._generalAdapter.isMatch(first, second);
    }

    match(...items: IDbRecordBase[]) {
        return this._generalAdapter.match(...items);
    }

    serialize(...entities: TEntity[]): any[] {
        const composed = this.changeTracker.enrichment.compose("serialize");
        return entities.map(composed);
    }

    deserialize(...entities: any[]) {
        const composed = this.changeTracker.enrichment.compose("deserialize");
        return entities.map(composed);
    }
}