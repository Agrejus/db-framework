import { getDbSetCacheValue, setDbSetCacheValue } from "../../cache/DbSetCache";
import { SearchResult } from "../../common/SearchResult";
import { IDbSetChangeTracker } from "../../types/change-tracking-types";
import { DbSetCacheOptions } from "../../types/dbset-types";
import { IDbRecord } from "../../types/entity-types";

export class DbSetCacheAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    private readonly _prefix: string;
    private readonly _documentType: TDocumentType;
    private readonly _changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>;

    constructor(prefix: string, documentType: TDocumentType, changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        this._changeTracker = changeTracker;
        this._prefix = prefix;
        this._documentType = documentType;
    }

    async resolve(fetch: () => Promise<SearchResult<TDocumentType, TEntity, TExclusions>>, cacheOptions: DbSetCacheOptions) {
        
        const key = cacheOptions.activeCacheKey!;
        const ttl = cacheOptions.cacheConfiguration[key];
        
        delete cacheOptions.cacheConfiguration[key]
        cacheOptions.activeCacheKey = null;

        const result = getDbSetCacheValue<TDocumentType, TEntity[]>(this._prefix, this._documentType, {
            key,
            ttl
        });

        if (result != null) {
            return new SearchResult<TDocumentType, TEntity, TExclusions>(result, this._changeTracker);
        }

        const value = await fetch();
        setDbSetCacheValue<TDocumentType, TEntity[]>(this._prefix, this._documentType, {
            key,
            ttl
        }, value.toResult());

        return value;

    }
}