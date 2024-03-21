import { IDbRecord } from '../types/entity-types';
import { DbSetPickDefaultActionRequired, EntitySelector } from '../types/common-types';
import { IPrivateContext } from '../types/context-types';
import { DbSetType, IDbSetApi, IDbSetProps, SaveChangesEventData } from '../types/dbset-types';
import { CustomIdCreator, EntityEnhancer } from '../types/dbset-builder-types';
import { IDbSetChangeTracker } from '../types/change-tracking-types';
import { IDbPlugin } from '../types/plugin-types';

export abstract class DbSetBaseAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity, TDbPlugin> {

    protected defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity, TExclusions>;
    protected documentType: TDocumentType;
    protected context: IPrivateContext<TDocumentType, TEntity, TExclusions, TDbPlugin>;
    protected api: IDbSetApi<TDocumentType, TEntity, TExclusions, IDbPlugin<TDocumentType, TEntity, TExclusions>>;
    protected isReadonly: boolean;
    protected filterSelector: EntitySelector<TDocumentType, TEntity> | null;
    protected type: DbSetType;
    protected changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>;
    protected idCreator: CustomIdCreator<TDocumentType, TEntity>;
    protected enhancer?: EntityEnhancer<TDocumentType, TEntity>;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        this.documentType = props.documentType;
        this.context = props.context as IPrivateContext<TDocumentType, TEntity, TExclusions, TDbPlugin>;
        this.defaults = props.defaults;
        this.isReadonly = props.readonly;
        this.idCreator = props.idCreator;
        this.filterSelector = props.filterSelector;
        this.enhancer = props.enhancer;

        this.type = type;
        this.changeTracker = changeTracker;

        this.api = this.context._getApi() as IDbSetApi<TDocumentType, TEntity, TExclusions, IDbPlugin<TDocumentType, TEntity, TExclusions>>;
    }

    protected async onAfterDataFetched(data: TEntity[]) {

    }
}