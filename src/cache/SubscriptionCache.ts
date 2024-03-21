import { DbSetSubscription } from "../types/dbset-types";
import { IDbRecord } from "../types/entity-types";
import { CacheBase } from "./base/CacheBase";

export class DbSetSubscriptionCache<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends CacheBase<TDocumentType, TEntity, TExclusions> {
    
    constructor(dataContextId: string, documentType: TDocumentType) {
        super("Subscriptions", dataContextId, documentType);
    }

    put(value: DbSetSubscription<TDocumentType, TEntity, TExclusions>) {
        const subscriptions = this.get();
    
        subscriptions[value.id] = value;
    
        this.putValue<{ [key: string]: DbSetSubscription<TDocumentType, TEntity, TExclusions> }>(subscriptions);
    }

    get() {
        return this.getValue<{ [key: string]: DbSetSubscription<TDocumentType, TEntity, TExclusions> }>() ?? {};
    }

    clear(...keys: string[]) {
        this.clearValue(...keys);
    }
}