import { IDbSetCacheAdapter } from "../../types/adapter-types";
import { DbSetTtlCacheConfiguration } from "../../types/dbset-types";
import { IDbRecord } from "../../types/entity-types";
import { DbSetCacheAdapter } from "../DbSetCacheAdapter";
import { DbSetCacheTtlAdapter } from "../DbSetCacheTtlAdapter";

export class DbSetCacheMediator<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> implements IDbSetCacheAdapter<TDocumentType, TEntity, TExclusions> {

    private readonly _cacheAdapter: IDbSetCacheAdapter<TDocumentType, TEntity, TExclusions>;
    private readonly _cacheTtlAdapter: IDbSetCacheAdapter<TDocumentType, TEntity, TExclusions>;
    private readonly _all: () => Promise<TEntity[]>;

    constructor(prefix: string, documentType: TDocumentType, all: () => Promise<TEntity[]>, idPropertyName: keyof TEntity) {
        this._all = all;
        this._cacheAdapter = new DbSetCacheAdapter<TDocumentType, TEntity, TExclusions>(prefix, documentType, idPropertyName);
        this._cacheTtlAdapter = new DbSetCacheTtlAdapter<TDocumentType, TEntity, TExclusions>(prefix, documentType, idPropertyName);
    }

    async resolve(fetch: () => Promise<TEntity[]>, cacheOptions: DbSetTtlCacheConfiguration | true | null, ...ids: string[]) {

        if (cacheOptions == null) {
            return await fetch();
        }

        if (cacheOptions === true) {
            // always grab all documents regardless of the query.  
            return await this._cacheAdapter.resolve(() => this._all(), cacheOptions, ...ids);
        }

        return await this._cacheTtlAdapter.resolve(fetch, cacheOptions, ...ids);
    }

    clear(...keys: string[]): void {
        this._cacheAdapter.clear(...keys);
        this._cacheTtlAdapter.clear(...keys);
    }
}   