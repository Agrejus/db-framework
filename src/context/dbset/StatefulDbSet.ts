import { DbSetStatefulModificationAdapter } from '../../adapters/stateful/DbSetStatefulModificationAdapter';
import { EntitySelector } from '../../types/common-types';
import { DbSetType, IDbSetState, IStatefulDbSet, IStoreDbSetProps } from '../../types/dbset-types';
import { IDbRecord, OmittedEntity } from '../../types/entity-types';
import { DbSet } from './DbSet';

/**
 * StatefulDbSet
 * @deprecated use default dbset
 */
export class StatefulDbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> extends DbSet<TDocumentType, TEntity, TExclusions, TDbPlugin> implements IStatefulDbSet<TDocumentType, TEntity, TExclusions, TDbPlugin> {

    constructor(props: IStoreDbSetProps<TDocumentType, TEntity, TExclusions>) {
        super(props);
    }

    private get storeModificationAdapter() {
        return this._modificationAdapter as DbSetStatefulModificationAdapter<TEntity["DocumentType"], TEntity, TExclusions, TDbPlugin>;
    }

    async hydrate() {
        return await this.storeModificationAdapter.hydrate();
    }

    protected override getDbSetType(): DbSetType {
        return "stateful";
    }

    get state(): IDbSetState<TDocumentType, TEntity, TExclusions> {
        const data = this.storeModificationAdapter.getStoreData();

        return {
            filter: (selector: EntitySelector<TDocumentType, TEntity>) => {
                return data.filter(selector);
            },
            find: (selector: EntitySelector<TDocumentType, TEntity>): TEntity | undefined => {
                return data.find(selector);
            },
            all: () => {
                return data
            },
            add: (...entities: OmittedEntity<TEntity, TExclusions>[]) => {
                return this.storeModificationAdapter.addRemote(...entities);
            }
        }
    }
}