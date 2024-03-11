import { DbSetCacheConfiguration } from "../types/dbset-types";
import { memoryCache } from './MemoryCache';

const createCacheKey = (documentType: string, configuration: DbSetCacheConfiguration) => {
    return `${documentType}-${configuration.key}`;
}

export const getDbSetCacheValue = <TDocumentType extends string, TResult>(documentType: TDocumentType, configuration: DbSetCacheConfiguration) => {
    const key = createCacheKey(documentType, configuration);
    const result = memoryCache.get<{ value: TResult, expiration: number }>(key);

    if (result == null) {
        return null;
    }

    const now = Date.now();

    if (now > result.expiration) {
        memoryCache.remove(key);
        return null; // null to trigger a fetch
    }

    return result.value;
}

export const setDbSetCacheValue = <TDocumentType extends string, TValue>(documentType: TDocumentType, configuration: DbSetCacheConfiguration, value: TValue) => {
    const key = createCacheKey(documentType, configuration);
    const expiration = Date.now() + (configuration.ttl * 1000);
    memoryCache.put<{ value: TValue, expiration: number }>(key, { value, expiration });
}