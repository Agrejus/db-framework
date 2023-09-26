import { DbSetStoreModificationAdapter } from '../../adapters/store/DbSetStoreModificationAdapter';
import { DbSetType, IStoreDbSet, IStoreDbSetProps } from '../../types/dbset-types';
import { IDbRecord } from '../../types/entity-types';
import { DbSet } from './DbSet';

export class StoreDbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSet<TDocumentType, TEntity, TExtraExclusions> implements IStoreDbSet<TDocumentType, TEntity, TExtraExclusions> {
        /**
     * Constructor
     * @param props Properties for the constructor
     */
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

    get store() {
        const modificationAdapter = this._modificationAdapter as DbSetStoreModificationAdapter<TDocumentType, TEntity, TExtraExclusions>;
        return modificationAdapter.getStoreData()
    }
}