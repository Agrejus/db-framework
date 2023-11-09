import { v4 as uuidv4 } from 'uuid';
import { EntityIdKeys, IDbRecord, IIndexableEntity } from '../types/entity-types';
import { DbSetPickDefaultActionRequired, DocumentKeySelector, EntitySelector } from '../types/common-types';
import { IPrivateContext } from '../types/context-types';
import { DbSetType, EntityAndTag, IDbSetApi, IDbSetProps, SaveChangesEventData } from '../types/dbset-types';
import { DbSetKeyType, PropertyMap } from '../types/dbset-builder-types';
import { IDbSetChangeTracker } from '../types/change-tracking-types';
import { CustomChangeTrackingAdapter } from './change-tracking/CustomChangeTrackingAdapter';
import { EntityChangeTrackingAdapter } from './change-tracking/EntityChangeTrackingAdapter';
import { ReadonlyChangeTrackingAdapter } from './change-tracking/ReadonlyChangeTrackingAdapter';

export abstract class DbSetBaseAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> {

    protected defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity, TExclusions>;
    protected idKeys: EntityIdKeys<TDocumentType, TEntity>;
    protected documentType: TDocumentType;
    protected context: IPrivateContext<TDocumentType, TEntity, TExclusions>;
    protected api: IDbSetApi<TDocumentType, TEntity, TExclusions>;
    protected isReadonly: boolean;
    protected keyType: DbSetKeyType;
    protected map: PropertyMap<TDocumentType, TEntity, any>[];
    protected filterSelector: EntitySelector<TDocumentType, TEntity> | null;
    protected type: DbSetType;
    protected changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType) {
        this.documentType = props.documentType;
        this.context = props.context as IPrivateContext<TDocumentType, TEntity, TExclusions>;
        this.idKeys = props.idKeys;
        this.defaults = props.defaults;
        this.isReadonly = props.readonly;
        this.keyType = props.keyType;
        this.map = props.map;
        this.filterSelector = props.filterSelector;
        this.type = type;

        this.api = this.context._getApi();

        const idPropertyName = this.api.dbPlugin.idPropertName;
        const environment = this.api.contextOptions.environment;

        if (props.readonly === true) {
            this.changeTracker = new ReadonlyChangeTrackingAdapter(idPropertyName, this.map, environment);
        } else if (props.entityComparator != null) {
            this.changeTracker = new CustomChangeTrackingAdapter(idPropertyName, this.map, environment, props.entityComparator);
        } else {
            this.changeTracker = new EntityChangeTrackingAdapter(idPropertyName, this.map, environment);
        }

        this.api.registerOnAfterSaveChanges(props.documentType, this.onAfterSaveChanges.bind(this));
        this.api.registerOnBeforeSaveChanges(props.documentType, this.onBeforeSaveChanges.bind(this));
    }

    protected async allDataAndMakeTrackable() {
        const data = await this.getAllData();

        // process the mappings when we make the item trackable.  We are essentially prepping the entity
        const result = data.map(w => this.changeTracker.enableChangeTracking(w, this.defaults.retrieve, this.isReadonly, this.map));

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

        const attached = this.changeTracker.attach(result);

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

        if (this.keyType === 'auto') {
            return uuidv4();
        }

        if (this.keyType === 'none') {
            return this.documentType;
        }

        // user defined key
        const indexableEntity = entity as IIndexableEntity

        const keyData = this.idKeys.map(w => {
            if (typeof w === "string") {
                return indexableEntity[w];
            }

            const selector: DocumentKeySelector<TEntity> = w as any;

            return String(selector(entity));
        });

        return [this.documentType, ...keyData].filter(w => !!w).join("/");
    }
}