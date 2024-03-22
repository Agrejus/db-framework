import { CacheType, TtlEntityCache, MatchType } from "../types/common-types";
import { DbSetTtlCacheConfiguration } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";
import { DbSetCacheBase } from "./base/DbSetCacheBase";

export class DbSetTtlCache<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends DbSetCacheBase<TDocumentType, TEntity, TExclusions> {

    constructor(dataContextId: string, documentType: TDocumentType, idPropertyName: keyof TEntity) {
        super("TtlCache", dataContextId, documentType, idPropertyName);
    }

    private _calcualteExpiration(configuration: DbSetTtlCacheConfiguration) {
        if (configuration.ttl == null) {
            return -1; // expire immediately
        }

        return Date.now() + (configuration.ttl * 1000);
    }

    put(configuration: DbSetTtlCacheConfiguration, type: CacheType, _: MatchType, value: TEntity[]) {

        if (value.length === 0) {
            return [];
        }

        const cacheSection = this.getValue<TtlEntityCache<TDocumentType, TEntity>>() ?? { cache: {}, expirations: {} } as TtlEntityCache<TDocumentType, TEntity>;

        if (cacheSection.cache[type] == null) {
            cacheSection.cache[type] = {};
        }

        const result = this.toDictionary(value);
        const expiration = this._calcualteExpiration(configuration);

        // cache all data
        cacheSection.cache[type][configuration.key] = result;
        cacheSection.expirations[configuration.key] = expiration;

        this.putValue<TtlEntityCache<TDocumentType, TEntity>>(cacheSection);

        // we always want to return the data for the matching key
        return Object.values(result);
    }

    get(configuration: DbSetTtlCacheConfiguration, type: CacheType): { matchType: MatchType, data: TEntity[] } {

        const cacheSection = this.getValue<TtlEntityCache<TDocumentType, TEntity>>();

        if (cacheSection == null) {
            return {
                matchType: "missing",
                data: []
            };
        }

        const tagsDictionary = cacheSection.cache[type];

        if (tagsDictionary == null) {
            return {
                matchType: "missing",
                data: []
            };
        }

        const tagCache = tagsDictionary[configuration.key];

        if (tagCache == null) {
            return {
                matchType: "missing",
                data: []
            };
        }

        const expiration = cacheSection.expirations[configuration.key];


        if (Date.now() > expiration) {

            delete cacheSection.cache[type][configuration.key];
            delete cacheSection.expirations[configuration.key];

            this.putValue<TtlEntityCache<TDocumentType, TEntity>>(cacheSection);

            // return nothing to trigger a fetch
            return {
                matchType: "missing",
                data: []
            };
        }

        return {
            matchType: "exact",
            data: Object.values(tagCache)
        }
    }

    clear(...keys: string[]) {
        this.clearValue(...keys);
    }
}