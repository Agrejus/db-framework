import { IDbRecord } from "../../types/entity-types";
import { memoryCache } from "../MemoryCache";

export abstract class CacheBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    private readonly _cacheKey: string;

    constructor(section: string, dataContextId: string, documentType: TDocumentType) {
        this._cacheKey = `${dataContextId}:${section}:${documentType}`;
    }

    protected getValue<T>() {
        return memoryCache.get<T>(this._cacheKey);
    }

    protected putValue<T extends {}>(data: Partial<T>) {
        return memoryCache.put<T>(this._cacheKey, data);
    }

    protected clearValue(...keys: string[]) {

        if (keys.length === 0) {
            memoryCache.remove(this._cacheKey);
            return;
        }

        const cacheSection = memoryCache.get<{}>(this._cacheKey) as { [key: string]: unknown };

        if (cacheSection == null) {
            return;
        }

        for (const key of keys) {
            // need to delete data properly
            delete cacheSection[key];
        }

        memoryCache.put<{}>(this._cacheKey, cacheSection);
    }
}