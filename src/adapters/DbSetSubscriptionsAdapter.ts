
import { GenericSelector } from '../types/common-types';
import { DbSetSubscriptionCallback, EntityAndTag, IDbSetProps } from '../types/dbset-types';
import { IDbRecord } from '../types/entity-types';
import { v4 as uuidv4 } from 'uuid';
import { DbSetSubscriptionCache } from '../cache/SubscriptionCache';

export class DbSetSubscriptionsAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    private readonly _subscriptionCache: DbSetSubscriptionCache<TDocumentType, TEntity, TExclusions>;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>) {
        this._subscriptionCache = new DbSetSubscriptionCache<TDocumentType, TEntity, TExclusions>(props.context.contextId(), props.documentType);
    }

    subscribe(callback: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>): () => void;
    subscribe(selector: GenericSelector<EntityAndTag<TEntity>>, callback: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>): () => void;
    subscribe(selectorOrCallback: GenericSelector<EntityAndTag<TEntity>> | DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>, callback?: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>) {
        
        const id = uuidv4();
        
        if (callback == null) {
            const cb = selectorOrCallback as DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>;

            this._subscriptionCache.put({
                id,
                callback: cb
            });
            return () => this._subscriptionCache.clear(id) 
        }

        this._subscriptionCache.put({
            id,
            callback,
            selector: selectorOrCallback as GenericSelector<EntityAndTag<TEntity>>
        });
        return () => this._subscriptionCache.clear(id)
    }

    getSubscribers() {
        const subscribers = this._subscriptionCache.get();
        return Object.values(subscribers);
    }
}