import { DbSetStoreModificationAdapter } from '../../adapters/store/DbSetStoreModificationAdapter';
import { EntitySelector } from '../../types/common-types';
import { DbSetStores, DbSetType, IStoreDbSet, IStoreDbSetProps } from '../../types/dbset-types';
import { IDbRecord } from '../../types/entity-types';
import { DbSet } from './DbSet';

export class StoreDbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> extends DbSet<TDocumentType, TEntity, TExclusions> implements IStoreDbSet<TDocumentType, TEntity, TExclusions> {

    constructor(props: IStoreDbSetProps<TDocumentType, TEntity, TExclusions>) {
        super(props);
    }
    
    async hydrate() {
        const modificationAdapter = this._modificationAdapter as DbSetStoreModificationAdapter<TDocumentType, TEntity, TExclusions>;
        return await modificationAdapter.hydrate();
    }

    protected override getDbSetType(): DbSetType {
        return "store";
    }
    
    get store(): DbSetStores<TDocumentType, TEntity> {
        const modificationAdapter = this._modificationAdapter as DbSetStoreModificationAdapter<TDocumentType, TEntity, TExclusions>;
        const data =  modificationAdapter.getStoreData();

        return {
            filter: (selector: EntitySelector<TDocumentType, TEntity>) => {
                return data.filter(selector);
            },
            find: (selector: EntitySelector<TDocumentType, TEntity>): TEntity | undefined => {
                return data.find(selector);
            },
            all: () => {
                return data
            }
        }
    }
}