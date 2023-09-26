import { AdapterFactory } from '../../adapters/AdapterFactory';
import { IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetModificationAdapter } from '../../types/adapter-types';
import { EntitySelector } from '../../types/common-types';
import { IDbSetProps, IDbSet, DbSetType } from '../../types/dbset-types';
import { IDbRecord, OmittedEntity, IDbRecordBase } from '../../types/entity-types';
import { IDbPlugin } from '../../types/plugin-types';

/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> implements IDbSet<TDocumentType, TEntity, TExtraExclusions> {

    protected readonly _fetchAdapter: IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions>;
    protected readonly _generalAdapter: IDbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions>;
    protected readonly _modificationAdapter: IDbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions>;
    protected readonly plugin: IDbPlugin<TDocumentType, TEntity>;

    protected getDbSetType(): DbSetType {
        return "default";
    }

    get types() {
        return {
            modify: {} as OmittedEntity<TEntity, TExtraExclusions>,
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
    constructor(props: IDbSetProps<TDocumentType, TEntity>) {

        const adapterFactory = new AdapterFactory<TDocumentType, TEntity, TExtraExclusions>(props, this.types.dbsetType);

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

    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]) {
        return this._modificationAdapter.instance(...entities);
    }

    async add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]) {
        return await this._modificationAdapter.add(...entities);
    }

    async upsert(...entities: (OmittedEntity<TEntity, TExtraExclusions> | Omit<TEntity, "DocumentType">)[]) {
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

    unlink(...entities: TEntity[]) {
        this._generalAdapter.unlink(...entities);
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