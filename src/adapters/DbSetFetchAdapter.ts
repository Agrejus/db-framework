import { SearchResult } from '../common/SearchResult';
import { IDbSetCacheAdapter, IDbSetFetchAdapter } from '../types/adapter-types';
import { IDbSetChangeTracker } from '../types/change-tracking-types';
import { EntitySelector } from '../types/common-types';
import { DbSetCacheConfiguration, DbSetTtlCacheConfiguration, DbSetType, IDbSetProps } from '../types/dbset-types';
import { IDbRecord } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';
import { DbSetCacheMediator } from './mediators/DbSetCacheMediator';

export class DbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> extends DbSetBaseAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin> implements IDbSetFetchAdapter<TDocumentType, TEntity, TExclusions> {

    private _cacheOptions: DbSetTtlCacheConfiguration | DbSetCacheConfiguration = { key: null };
    private _cacheMediator: IDbSetCacheAdapter<TDocumentType, TEntity, TExclusions>;
    private _idPropertyName: keyof TEntity;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, idPropertyName: keyof TEntity, changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        super(props, type, changeTracker);
        this._idPropertyName = idPropertyName;
        this._cacheMediator = new DbSetCacheMediator<TDocumentType, TEntity, TExclusions>(props.context.contextId(), props.documentType, this._idPropertyName);
    }

    useCache(configuration: DbSetTtlCacheConfiguration) {

        this._cacheOptions.key = configuration.key;

        if ('ttl' in configuration) {
            (this._cacheOptions as DbSetTtlCacheConfiguration).ttl = configuration.ttl;
        }
    }

    clearCache(...keys: string[]) {
        this._cacheMediator.clear(...keys);
    }

    private async _all() {
        return await this._cacheMediator.resolve(() => this.api.dbPlugin.all({ DocumentType: this.documentType }), this._cacheOptions)
    }

    protected async applyBaseFilter(fetch: () => Promise<TEntity[]>) {

        const data = await fetch();

        if (this.filterSelector == null) {
            return data
        }

        return data.filter(this.filterSelector);
    }

    async all() {
        const data = await this.applyBaseFilter(() => this._all());
        return new SearchResult<TDocumentType, TEntity, TExclusions>(data, this.changeTracker, this.onAfterDataFetched.bind(this));
    }

    async getStrict(...ids: string[]) {
        const data = await this._cacheMediator.resolve(() => this.api.dbPlugin.getStrict(this.documentType, ...ids), this._cacheOptions, ...ids)
        const filtered = this.filterSelector == null ? data : data.filter(this.filterSelector);
        return new SearchResult<TDocumentType, TEntity, TExclusions>(filtered, this.changeTracker, this.onAfterDataFetched.bind(this));
    }

    async get(...ids: string[]) {
        const data = await this._cacheMediator.resolve(() => this.api.dbPlugin.get(this.documentType, ...ids), this._cacheOptions, ...ids)
        const baseFilteredData = this.filterSelector == null ? data : data.filter(this.filterSelector);
        return new SearchResult<TDocumentType, TEntity, TExclusions>(baseFilteredData, this.changeTracker, this.onAfterDataFetched.bind(this));
    }

    async first() {
        const data = await this.applyBaseFilter(() => this._all());

        if (data.length === 0) {
            return undefined;
        }

        const found = data[0];
        return new SearchResult<TDocumentType, TEntity, TExclusions>([found], this.changeTracker, this.onAfterDataFetched.bind(this));
    }

    async pluck<TKey extends keyof TEntity>(selector: EntitySelector<TDocumentType, TEntity>, propertySelector: TKey): Promise<TEntity[TKey]> {
        const data = await this.applyBaseFilter(() => this._all());
        const found = data.find(selector);

        if (found == null) {
            throw new Error('Entity not found for pluck')
        }

        return found[propertySelector];
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        const data = await this.applyBaseFilter(() => this._all());
        const filtered = data.filter(selector);

        return new SearchResult<TDocumentType, TEntity, TExclusions>(filtered, this.changeTracker, this.onAfterDataFetched.bind(this));
    }

    async find(selector: EntitySelector<TDocumentType, TEntity>) {
        const data = await this.applyBaseFilter(() => this._all());

        const found = data.find(selector);

        if (found == null) {
            return undefined;
        }

        return new SearchResult<TDocumentType, TEntity, TExclusions>([found], this.changeTracker, this.onAfterDataFetched.bind(this));
    }
}