import { DbSetCache } from "../cache/DbSetCache";
import { IDbRecord } from "../types/entity-types";

export class DbSetCacheAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    private readonly _idPropertyName: keyof TEntity;
    private readonly cache: DbSetCache<TDocumentType, TEntity, TExclusions>;

    constructor(prefix: string, documentType: TDocumentType, idPropertyName: keyof TEntity) {
        this._idPropertyName = idPropertyName;
        this.cache = new DbSetCache<TDocumentType, TEntity, TExclusions>(prefix, documentType, idPropertyName);
    }

    async resolve(fetch: () => Promise<TEntity[]>, _: true, ...ids: string[]): Promise<TEntity[]> {

        if (ids.length === 0) {
            // all request
            return await this._resovleAllRequest(fetch);
        }

        return await this._resovleGetRequest(fetch, ids);
    }

    clear(...keys: string[]) {
        this.cache.clear(...keys);
    }

    private async _resovleGetRequest(fetch: () => Promise<TEntity[]>, ids: string[]) {
        const result = this.cache.get();

        if (result.data.length !== 0) {

            const idMap = new Set<string>(ids);
            return result.data.filter(w => idMap.has(w[this._idPropertyName] as any) === true);
        }

        const value = await fetch();

        return this.cache.put(value);
    }

    private async _resovleAllRequest(fetch: () => Promise<TEntity[]>) {
        const result = this.cache.get();

        if (result.data.length !== 0) {

            return result.data;
        }

        const value = await fetch();

        return this.cache.put(value);
    }
}