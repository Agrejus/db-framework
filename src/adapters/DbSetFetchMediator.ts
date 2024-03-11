import { getDbSetCacheValue, setDbSetCacheValue } from '../cache/DbSetCache';
import { IDbSetFetchAdapter, IDbSetFetchMediator } from '../types/adapter-types';
import { IDbSetChangeTracker } from '../types/change-tracking-types';
import { EntitySelector } from '../types/common-types';
import { DbSetType, IDbSetProps } from '../types/dbset-types';
import { IDbRecord } from '../types/entity-types';
import { DbSetFetchAdapter } from './DbSetFetchAdapter';

export class DbSetFetchMediator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> implements IDbSetFetchMediator<TDocumentType, TEntity, TExclusions> {

    private _activeCacheKey: string | null = null;
    private _cacheConfiguration: { [key: string]: number } = {};
    private _fetchAdapter: IDbSetFetchAdapter<TDocumentType, TEntity, TExclusions>;
    private _documentType: TDocumentType;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        this._fetchAdapter = new DbSetFetchAdapter<TDocumentType, TEntity, TExclusions, TDbPlugin>(props, type, changeTracker);
        this._documentType = props.documentType;
    }

    useCache(configuration: { ttl: number, key: string }) {
        const { ttl, key } = configuration;
        this._cacheConfiguration[key] = ttl
        this._activeCacheKey = key;
    }

    clearCache(...keys: string[]) {
        if (keys.length === 0) {
            //
            return;
        }
    }

    private async _resolve<T>(fetch: () => Promise<T>) {
        debugger;
        if (this._activeCacheKey == null) {
            // do nothing
            return await fetch();
        }

        const key = this._activeCacheKey;
        this._activeCacheKey = null;

        const result = getDbSetCacheValue<TDocumentType, T>(this._documentType, {
            key,
            ttl: this._cacheConfiguration[key]
        });

        if (result != null) {
            return result;
        }

        const value = await fetch();
        setDbSetCacheValue<TDocumentType, T>(this._documentType, {
            key,
            ttl: this._cacheConfiguration[key]
        }, value);

        return value;
    }

    async pluck<TKey extends keyof TEntity>(selector: EntitySelector<TDocumentType, TEntity>, propertySelector: TKey) {
        return await this._resolve(() => this._fetchAdapter.pluck(selector, propertySelector));
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        return await this._resolve(() => this._fetchAdapter.filter(selector));
    }

    async all() {
        return await this._resolve(() => this._fetchAdapter.all());
    }

    async get(...ids: string[]) {
        return await this._resolve(() => this._fetchAdapter.get(...ids));
    }


    async find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined> {
        return await this._resolve(() => this._fetchAdapter.find(selector));
    }

    async first() {
        return await this._resolve(() => this._fetchAdapter.first());
    }
}