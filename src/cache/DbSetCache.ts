import { DbSetCacheConfiguration } from "../types/dbset-types";
import { memoryCache } from './MemoryCache';

type CacheEntry<T> = {
    value: T;
    expiration: number;
}

type CacheSection<T> = { [key: string]: CacheEntry<T> }

export const createSectionCacheKey = (documentType: string, prefix: string) => {
    return `${prefix}:${documentType}`;
}

export const getDbSetCacheValue = <TDocumentType extends string, TResult>(prefix: string, documentType: TDocumentType, configuration: DbSetCacheConfiguration) => {
    const cacheSectionKey = createSectionCacheKey(documentType, prefix);
    const cacheSection = memoryCache.get<CacheSection<TResult>>(cacheSectionKey);

    if (cacheSection == null) {
        return null;
    }

    const result = cacheSection[configuration.key];

    if (result == null) {
        return null;
    }

    const now = Date.now();

    if (now > result.expiration) {
        memoryCache.remove(cacheSectionKey);
        return null; // null to trigger a fetch
    }

    return result.value;
}

export const setDbSetCacheValue = <TDocumentType extends string, TValue>(prefix: string, documentType: TDocumentType, configuration: DbSetCacheConfiguration, value: TValue) => {
    const cacheSectionKey = createSectionCacheKey(documentType, prefix);
    const cacheSection = memoryCache.get<CacheSection<TValue>>(cacheSectionKey) ?? {};

    const expiration = Date.now() + (configuration.ttl * 1000);

    cacheSection[configuration.key] = {
        value,
        expiration
    }

    memoryCache.put<CacheSection<TValue>>(cacheSectionKey, cacheSection);
}

export const clearDbSetCache = <TDocumentType extends string>(prefix: string, documentType: TDocumentType, keys: string[]) => {

    const cacheSectionKey = createSectionCacheKey(documentType, prefix);
    
    if (keys.length === 0) {
        memoryCache.remove(cacheSectionKey);
        return;
    }

    const cacheSection = memoryCache.get<CacheSection<any>>(cacheSectionKey);

    for(const key of keys) {
        delete cacheSection[key];
    }

    memoryCache.put<CacheSection<any>>(cacheSectionKey, cacheSection);
}