import { IDbRecord } from '../types/entity-types';
import { DbSetPickDefaultActionRequired, EntitySelector } from '../types/common-types';
import { IPrivateContext } from '../types/context-types';
import { DbSetType, IDbSetApi, IDbSetProps, SaveChangesEventData } from '../types/dbset-types';
import { CustomIdCreator, EntityEnhancer } from '../types/dbset-builder-types';
import { IDbSetChangeTracker } from '../types/change-tracking-types';

export abstract class DbSetBaseAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {

    protected defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity, TExclusions>;
    protected documentType: TDocumentType;
    protected context: IPrivateContext<TDocumentType, TEntity, TExclusions>;
    protected api: IDbSetApi<TDocumentType, TEntity, TExclusions>;
    protected isReadonly: boolean;
    protected filterSelector: EntitySelector<TDocumentType, TEntity> | null;
    protected type: DbSetType;
    protected changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>;
    protected idCreator: CustomIdCreator<TDocumentType, TEntity>;
    protected enhancer?: EntityEnhancer<TDocumentType, TEntity>

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        this.documentType = props.documentType;
        this.context = props.context as IPrivateContext<TDocumentType, TEntity, TExclusions>;
        this.defaults = props.defaults;
        this.isReadonly = props.readonly;
        this.idCreator = props.idCreator;
        this.filterSelector = props.filterSelector;
        this.enhancer = props.enhancer;

        this.type = type;
        this.changeTracker = changeTracker;

        this.api = this.context._getApi();

        this.api.registerOnAfterSaveChanges(props.documentType, this.onAfterSaveChanges.bind(this));
        this.api.registerOnBeforeSaveChanges(props.documentType, this.onBeforeSaveChanges.bind(this));
    }

    protected async allDataAndMakeTrackable() {
        const data = await this.getAllData();
        const enrich = this.changeTracker.enrichment.compose("deserialize", "defaultRetrieve", "changeTracking", "enhance", "destroyChanges")

        // process the mappings when we make the item trackable.  We are essentially prepping the entity
        const result = data.map(enrich);

        return this.filterResult(result);
    }

    protected async onAfterDataFetched(data: TEntity[]) {

    }

    protected async onBeforeSaveChanges(getChanges: <T extends SaveChangesEventData<TDocumentType, TEntity>>() => T) {

    }


    protected async onAfterSaveChanges(getChanges: <T extends SaveChangesEventData<TDocumentType, TEntity>>() => T) {

    }

    protected async _all() {
        const result = await this.allDataAndMakeTrackable();

        await this.onAfterDataFetched(result);

        const attached = this.changeTracker.attach(...result);

        return this.filterResult(attached);
    }

    protected filterResult(result: TEntity[]) {
        if (this.filterSelector == null) {
            return result;
        }

        return result.filter(w => this.filterSelector(w));
    }

    protected async getAllData() {
        return await this.api.dbPlugin.all({ DocumentType: this.documentType });
    }

    protected getKeyFromEntity(entity: TEntity) {
        return this.idCreator(entity);
    }
}