import { DbSetTtlCache } from "../cache/DbSetTtlCache";
import { DbSetTtlCacheConfiguration } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";

export class DbSetCacheTtlAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    private readonly _idPropertyName: keyof TEntity;
    private readonly cache: DbSetTtlCache<TDocumentType, TEntity, TExclusions>;

    constructor(prefix: string, documentType: TDocumentType, idPropertyName: keyof TEntity) {
        this._idPropertyName = idPropertyName;
        this.cache = new DbSetTtlCache<TDocumentType, TEntity, TExclusions>(prefix, documentType, idPropertyName);
    }

    async resolve(fetch: () => Promise<TEntity[]>, cacheOptions: DbSetTtlCacheConfiguration, ...ids: string[]): Promise<TEntity[]> {
        const key = cacheOptions.key;
        const ttl = cacheOptions.ttl;

        if (key == null) {
            return await fetch();
        }

        cacheOptions.key = null;
        cacheOptions.ttl = null;

        if (ids.length === 0) {
            // all request
            return await this._resovleAllRequest(fetch, key, ttl);
        }

        return await this._resovleGetRequest(fetch, key, ttl, ids);
    }

    clear(...keys: string[]) {
        this.cache.clear(...keys);
    }

    private async _resovleGetRequest(fetch: () => Promise<TEntity[]>, key: string, ttl: number, ids: string[]) {
        const result = this.cache.get({ key, ttl }, "get");

        if (result.data.length !== 0) {

            if (result.matchType === "queried") {
                // found in the cache, but no key existed, create the key with references to the existing data
                const idMap = new Set<string>(ids)
                const data = result.data.filter(w => idMap.has(w[this._idPropertyName] as any) === true);
                return this.cache.put({ key, ttl }, "get", result.matchType, data);
            }

            // exact match
            return result.data;
        }

        const value = await fetch();

        return this.cache.put({ key, ttl }, "get", result.matchType, value);
    }

    private async _resovleAllRequest(fetch: () => Promise<TEntity[]>, key: string, ttl: number) {
        const result = this.cache.get({ key, ttl }, "all");

        if (result.data.length !== 0) {

            if (result.matchType === "queried") {
                // means the data exists in all data and we need to cache the result and return it
                return this.cache.put({ key, ttl }, "all", result.matchType, result.data);
            }

            // exact match
            return result.data;
        }

        const value = await fetch();

        return this.cache.put({ key, ttl }, "all", result.matchType, value);
    }
}