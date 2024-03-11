import { AdapterFactory } from '../../adapters/AdapterFactory';
import { IDbSetFetchAdapter, IDbSetFetchMediator, IDbSetGeneralAdapter, IDbSetModificationAdapter } from '../../types/adapter-types';
import { EntitySelector } from '../../types/common-types';
import { IDbSetProps, DbSetType } from '../../types/dbset-types';
import { IDbRecord, OmittedEntity, IDbRecordBase } from '../../types/entity-types';
import { ChangeTrackingFactory } from '../../adapters/change-tracking/ChangeTrackingFactory';
import { ContextOptions, IPrivateContext } from '../../types/context-types';
import { IDbSetChangeTracker } from '../../types/change-tracking-types';
import { MonitoringMixin } from '../monitoring/MonitoringMixin';
import { memoryCache } from '../../cache/MemoryCache';

/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> {

    protected readonly _fetchMediator: IDbSetFetchMediator<TEntity["DocumentType"], TEntity, TExclusions>;
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

        const changeTrackingFactory = new ChangeTrackingFactory<TDocumentType, TEntity, TExclusions, TDbPlugin>(props, this.dbPlugin, api.contextId, api.contextOptions.environment ?? "development");

        this.changeTracker = changeTrackingFactory.getTracker();

        const adapterFactory = new AdapterFactory<TDocumentType, TEntity, TExclusions, TDbPlugin>(props, this.types.dbsetType, this.changeTracker);

        this._fetchMediator = adapterFactory.createFetchMediator();
        this._generalAdapter = adapterFactory.createGeneralAdapter();
        this._modificationAdapter = adapterFactory.createModificationAdapter();

        MonitoringMixin.register(`DbSet:${props.documentType}`, api.contextOptions, this, DbSet as any);
    }

    registerMonitoringMixin(instance: any, ...methodNames: string[]) {
        // when we extend a dbset, we need to add the function to the monitoring mixin
        MonitoringMixin.register(`DbSet:${this._documentType}`, this._contextOptions, instance, DbSet as any, methodNames);
    }

    useCache(configuration: { ttl: number, key: string }) {
        this._fetchMediator.useCache(configuration);
        return this;
    }

    clearCache(...keys: string[]) {
        this._fetchMediator.clearCache(...keys);
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
        return await this._fetchMediator.all();
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        return await this._fetchMediator.filter(selector);
    }

    isMatch(first: TEntity, second: any) {
        return this._generalAdapter.isMatch(first, second);
    }

    match(...items: IDbRecordBase[]) {
        return this._generalAdapter.match(...items);
    }

    async get(...ids: string[]) {
        return await this._fetchMediator.get(...ids);
    }

    async find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined> {
        return await this._fetchMediator.find(selector);
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

    async first() {
        return await this._fetchMediator.first();
    }

    async pluck<TKey extends keyof TEntity>(selector: EntitySelector<TDocumentType, TEntity>, propertySelector: TKey) {
        return await this._fetchMediator.pluck(selector, propertySelector);
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