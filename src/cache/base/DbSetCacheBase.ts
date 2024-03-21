import { IDictionary } from "../../types/common-types";
import { IDbRecord } from "../../types/entity-types";
import { CacheBase } from "./CacheBase";

export abstract class DbSetCacheBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends CacheBase<TDocumentType, TEntity, TExclusions> {

    protected readonly idPropertyName: keyof TEntity;

    constructor(section: string, dataContextId: string, documentType: TDocumentType, idPropertyName: keyof TEntity) {
        super(section, dataContextId, documentType);
        this.idPropertyName = idPropertyName;
    }

    protected toDictionary(data: TEntity[]) {
        const result = {} as IDictionary<TEntity>;

        for (let i = 0; i < data.length; i++) {
            const item = data[i];

            result[item[this.idPropertyName] as string] = item;
        }

        return result;
    }
}