import { clearDbSetCache } from '../cache/DbSetCache';
import { SearchResult } from '../common/SearchResult';
import { IDbSetFetchAdapter, IDbSetFetchMediator } from '../types/adapter-types';
import { IDbSetChangeTracker } from '../types/change-tracking-types';
import { EntitySelector } from '../types/common-types';
import { DbSetCacheOptions, DbSetType, IDbSetProps } from '../types/dbset-types';
import { IDbRecord } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';
import { DbSetFetchAdapter } from './DbSetFetchAdapter';
import { DbSetCacheAdapter } from './cache/DbSetCacheAdapter';

export class DbSetFetchMediator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> extends DbSetBaseAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin> implements IDbSetFetchMediator<TDocumentType, TEntity, TExclusions> {

    private _cacheOptions: DbSetCacheOptions = { activeCacheKey: null, cacheConfiguration: {} };
    private _fetchAdapter: IDbSetFetchAdapter<TDocumentType, TEntity, TExclusions>;
    private _documentType: TDocumentType;
    private _prefix: string;
    private _changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>;
    private _cacheAdapter: DbSetCacheAdapter<TDocumentType, TEntity, TExclusions>;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        super(props, type, changeTracker);
        this._fetchAdapter = new DbSetFetchAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin>(props, type, changeTracker);
        this._documentType = props.documentType;
        this._prefix = props.context.contextId();
        this._changeTracker = changeTracker;
        this._cacheAdapter = new DbSetCacheAdapter<TDocumentType, TEntity, TExclusions>(this._prefix, this._documentType, this._changeTracker);
    }

    useCache(configuration: { ttl: number, key: string }) {
        const { ttl, key } = configuration;
        this._cacheOptions.activeCacheKey = key;
        this._cacheOptions.cacheConfiguration[key] = ttl;
    }

    clearCache(...keys: string[]) {
        clearDbSetCache<TDocumentType>(this._prefix, this._documentType, keys);
    }

    private async _resolve(fetch: () => Promise<SearchResult<TDocumentType, TEntity, TExclusions>>) {

        // we could have a store and cache here
        if (this._cacheOptions.activeCacheKey == null) {
            // do nothing
            return await fetch();
        }

        return this._cacheAdapter.resolve(fetch, this._cacheOptions);
    }

    private async _fetch(selector: () => Promise<SearchResult<TDocumentType, TEntity, TExclusions>>) {
        const result = await this._resolve(selector);

        if (result.isEmpty() === true) {
            return [];
        }

        const trackedData = result.toTrackable();
        const attached = trackedData.toAttached();
        await this.onAfterDataFetched(attached);

        return attached;
    }

    async all() {
        return await this._fetch(() => this._fetchAdapter.all());
    }

    async get(...ids: string[]) {
        return await this._fetch(() => this._fetchAdapter.get(...ids));
    }

    async find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined> {
        const result = await this._fetch(() => this._fetchAdapter.find(selector));

        if (result.length === 0) {
            return undefined;
        }
        return result[0];
    }

    async first() {
        const result = await this._fetch(() => this._fetchAdapter.all());

        if (result.length === 0) {
            return undefined;
        }

        return result[0];
    }

    async pluck<TKey extends keyof TEntity>(selector: EntitySelector<TDocumentType, TEntity>, propertySelector: TKey) {
        const result = await this._resolve(() => this._fetchAdapter.find(selector));

        if (result.isEmpty() === true) {
            throw new Error('Entity not found for pluck')
        }
        const data = result.toResult();
        const first = data[0];

        await this.onAfterDataFetched([first]);

        return first[propertySelector];
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        return await this._fetch(() => this._fetchAdapter.filter(selector));
    }
}