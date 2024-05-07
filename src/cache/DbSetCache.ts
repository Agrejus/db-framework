import { EntityCache, MatchType } from "../types/common-types";
import { IDbRecord } from "../types/entity-types";
import { DbSetCacheBase } from "./base/DbSetCacheBase";

export class DbSetCache<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends DbSetCacheBase<TDocumentType, TEntity, TExclusions> {

    constructor(dataContextId: string, documentType: TDocumentType, idPropertyName: keyof TEntity) {
        super("Cache", dataContextId, documentType, idPropertyName);
    }

    put(value: TEntity[]) {

        if (value.length === 0) {
            return [];
        }

        const cacheSection = this.getValue<EntityCache<TDocumentType, TEntity>>() ?? { cache: {} } as EntityCache<TDocumentType, TEntity>;

        const result = this.toDictionary(value);

        // re-cache/cache all data
        cacheSection.data = result;

        this.putValue<EntityCache<TDocumentType, TEntity>>(cacheSection);

        // because we are putting items into a dictionary, the order can change, lets keep the ording the same like the get method does
        return Object.values(cacheSection.data);
    }

    get(): { matchType: MatchType, data: TEntity[] } {
        const cacheSection = this.getValue<EntityCache<TDocumentType, TEntity>>();

        if (cacheSection == null) {
            return {
                matchType: "missing",
                data: []
            };
        }

        const data = cacheSection.data;

        return {
            matchType: "exact",
            data: Object.values(data)
        }
    }

    clear(...keys: string[]) {
        this.clearValue(...keys);
    }
}