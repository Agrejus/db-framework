import { AdapterFactory } from '../../adapters/AdapterFactory';
import { IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetModificationAdapter } from '../../types/adapter-types';
import { EntitySelector } from '../../types/common-types';
import { IDbSetProps, DbSetType } from '../../types/dbset-types';
import { IDbRecord, OmittedEntity, IDbRecordBase } from '../../types/entity-types';
import { IDbPlugin } from '../../types/plugin-types';

/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {

    protected readonly _fetchAdapter: IDbSetFetchAdapter<TDocumentType, TEntity, TExclusions>;
    protected readonly _generalAdapter: IDbSetGeneralAdapter<TDocumentType, TEntity, TExclusions>;
    protected readonly _modificationAdapter: IDbSetModificationAdapter<TDocumentType, TEntity, TExclusions>;
    protected readonly plugin: IDbPlugin<TDocumentType, TEntity>;

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

        const adapterFactory = new AdapterFactory<TDocumentType, TEntity, TExclusions>(props, this.types.dbsetType);

        this._fetchAdapter = adapterFactory.createFetchAdapter();
        this._generalAdapter = adapterFactory.createGeneralAdapter();
        this._modificationAdapter = adapterFactory.createModificationAdapter();
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
        return await this._fetchAdapter.all();
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        return await this._fetchAdapter.filter(selector);
    }

    isMatch(first: TEntity, second: any) {
        return this._generalAdapter.isMatch(first, second);
    }

    match(...items: IDbRecordBase[]) {
        return this._generalAdapter.match(...items);
    }

    async get(...ids: string[]) {
        return await this._fetchAdapter.get(...ids);
    }

    async find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined> {
        return await this._fetchAdapter.find(selector);
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

    async first() {
        return await this._fetchAdapter.first();
    }
}