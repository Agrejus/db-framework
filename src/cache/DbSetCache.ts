import { CacheType, EntityCache, MatchType } from "../types/common-types";
import { DbSetCacheConfiguration } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";
import { DbSetCacheBase } from "./base/DbSetCacheBase";

export class DbSetCache<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends DbSetCacheBase<TDocumentType, TEntity, TExclusions> {

    constructor(dataContextId: string, documentType: TDocumentType, idPropertyName: keyof TEntity) {
        super("Cache", dataContextId, documentType, idPropertyName);
    }

    put(configuration: DbSetCacheConfiguration, type: CacheType, matchType: MatchType, value: TEntity[]) {

        if (value.length === 0) {
            return [];
        }   
    
        const cacheSection = this.getValue<EntityCache<TDocumentType, TEntity>>() ?? { cache: {} } as EntityCache<TDocumentType, TEntity>;
    
        if (cacheSection.cache[type] == null) {
            cacheSection.cache[type] = {};
        }

        const result = this.toDictionary(value);

        if (type === "all") {
            
    
            // re-cache/cache all data
            cacheSection.cache[type][configuration.key] = result;
    
            if (matchType === "missing") {
                // partial or all, it's already cached
                cacheSection.data = result;
            }
    
            this.putValue<EntityCache<TDocumentType, TEntity>>(cacheSection);
    
            // because we are putting items into a dictionary, the order can change, lets keep the ording the same like the get method does
            return Object.values(cacheSection.data);
        }
    
        // order does not matter here, we are selecting by specific id
        cacheSection.cache[type][configuration.key] = result;
    
        if (matchType === "missing") {
            // partial or all, it's already cached
            cacheSection.data = {
                ...cacheSection.data,
                ...result
            }
        }
    
        this.putValue<EntityCache<TDocumentType, TEntity>>(cacheSection);
    
        return value;
    }

    get(configuration: DbSetCacheConfiguration, type: CacheType): { matchType: MatchType, data: TEntity[] } {
        const cacheSection = this.getValue<EntityCache<TDocumentType, TEntity>>();

        if (cacheSection == null) {
            return {
                matchType: "missing",
                data: []
            };
        }

        const tagsDictionary = cacheSection.cache[type];

        if (tagsDictionary == null) {

            if (type === "get") {
                const allTagsDictionary = cacheSection.cache["all"];

                if (allTagsDictionary == null) {
                    return {
                        matchType: "missing",
                        data: []
                    };
                }

                // return all beecause it will be filtered down
                return {
                    matchType: "queried",
                    data: Object.values(cacheSection.data)
                };
            }

            return {
                matchType: "missing",
                data: []
            };
        }

        const tagCache = tagsDictionary[configuration.key];

        if (tagCache == null) {

            const allTagsDictionary = cacheSection.cache["all"];

            if (allTagsDictionary != null) {
                return {
                    matchType: "queried",
                    data: Object.values(cacheSection.data)
                };
            }

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