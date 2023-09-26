import { v4 as uuidv4 } from 'uuid';
import { EntityIdKeys, IDbRecord, IIndexableEntity } from '../types/entity-types';
import { DbSetPickDefaultActionRequired, DocumentKeySelector, EntitySelector } from '../types/common-types';
import { IPrivateContext } from '../types/context-types';
import { DbSetType, EntityAndTag, IDbSetApi, IDbSetProps } from '../types/dbset-types';
import { DbSetKeyType, PropertyMap } from '../types/dbset-builder-types';

export abstract class DbSetBaseAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> {

    protected defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>;
    protected idKeys: EntityIdKeys<TDocumentType, TEntity>;
    protected documentType: TDocumentType;
    protected context: IPrivateContext<TDocumentType, TEntity>;
    protected api: IDbSetApi<TDocumentType, TEntity>;
    protected isReadonly: boolean;
    protected keyType: DbSetKeyType;
    protected map: PropertyMap<TDocumentType, TEntity, any>[];
    protected filterSelector: EntitySelector<TDocumentType, TEntity> | null;
    protected type: DbSetType;

    constructor(props: IDbSetProps<TDocumentType, TEntity>, type: DbSetType) {
        this.documentType = props.documentType;
        this.context = props.context as IPrivateContext<TDocumentType, TEntity>;
        this.idKeys = props.idKeys;
        this.defaults = props.defaults;
        this.isReadonly = props.readonly;
        this.keyType = props.keyType;
        this.map = props.map;
        this.filterSelector = props.filterSelector;
        this.type = type;

        this.api = this.context._getApi();

        this.api.registerOnAfterSaveChanges(props.documentType, this.onAfterSaveChanges.bind(this));
        this.api.registerOnBeforeSaveChanges(props.documentType, this.onBeforeSaveChanges.bind(this));
    }

    protected async allDataAndMakeTrackable() {
        const data = await this.getAllData();

        // process the mappings when we make the item trackable.  We are essentially prepping the entity
        const result = data.map(w => this.api.makeTrackable(w, this.defaults.retrieve, this.isReadonly, this.map) as TEntity);

        return this.filterResult(result);
    }

    protected async onAfterDataFetched(data: TEntity[]) {

    }

    protected async onBeforeSaveChanges(getChanges: () => { adds: EntityAndTag[], removes: EntityAndTag[], updates: EntityAndTag[] }) {

    }


    protected async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[], removes: EntityAndTag[], updates: EntityAndTag[] }) {

    }

    protected async _all() {
        const result = await this.allDataAndMakeTrackable();

        await this.onAfterDataFetched(result);

        this.api.send(result);

        return this.filterResult(result);
    }

    protected filterResult(result: TEntity[]) {
        if (this.filterSelector == null) {
            return result;
        }

        return result.filter(w => this.filterSelector(w));
    }

    protected async getAllData() {
        return await this.api.getAllData({ DocumentType: this.documentType });
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