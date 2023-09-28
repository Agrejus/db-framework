import { DbSetStoreModificationAdapter } from '../../adapters/store/DbSetStoreModificationAdapter';
import { EntitySelector } from '../../types/common-types';
import { DbSetStores, DbSetType, IStoreDbSet, IStoreDbSetProps } from '../../types/dbset-types';
import { IDbRecord } from '../../types/entity-types';
import { DbSet } from './DbSet';

export class StoreDbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSet<TDocumentType, TEntity, TExtraExclusions> implements IStoreDbSet<TDocumentType, TEntity, TExtraExclusions> {

    constructor(props: IStoreDbSetProps<TDocumentType, TEntity>) {
        super(props);
    }
    
    async hydrate() {
        const modificationAdapter = this._modificationAdapter as DbSetStoreModificationAdapter<TDocumentType, TEntity, TExtraExclusions>;
        return await modificationAdapter.hydrate();
    }

    protected override getDbSetType(): DbSetType {
        return "store";
    }
    
    get store(): DbSetStores<TDocumentType, TEntity> {
        const modificationAdapter = this._modificationAdapter as DbSetStoreModificationAdapter<TDocumentType, TEntity, TExtraExclusions>;
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