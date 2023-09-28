import { IDbSetGeneralAdapter } from '../types/adapter-types';
import { IDbSetProps, IDbSetInfo, DbSetType } from '../types/dbset-types';
import { IDbRecord, IDbRecordBase, IIndexableEntity } from '../types/entity-types';
import { validateAttachedEntity } from '../validation/Validation';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';

export class DbSetGeneralAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions> {

    constructor(props: IDbSetProps<TDocumentType, TEntity>, type: DbSetType) {
        super(props, type);
    }

    isMatch(first: TEntity, second: any) {
        return this.getKeyFromEntity(first) === this.getKeyFromEntity(second);
    }

    match(...items: IDbRecordBase[]) {
        return items.filter(w => w.DocumentType === this.documentType) as TEntity[]
    }

    info() {
        const info: IDbSetInfo<TDocumentType, TEntity> = {
            DocumentType: this.documentType,
            IdKeys: this.idKeys,
            Defaults: this.defaults,
            KeyType: this.keyType,
            Readonly: this.isReadonly,
            Map: this.map
        }

        return info;
    }

    merge(from: TEntity, to: TEntity) {
        return this.api.changeTrackingAdapter.merge(from, to);
    }

    unlink(...entities: TEntity[]) {

        const validationFailures = entities.map(w => validateAttachedEntity<TDocumentType, TEntity>(w)).flat().filter(w => w.ok === false);

        if (validationFailures.length > 0) {
            const errors = validationFailures.map(w => w.error).join('\r\n')
            throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`)
        }

        this._detachItems(entities)
    }

    async markDirty(...entities: TEntity[]) {
        return await this.api.changeTrackingAdapter.markDirty(...entities);
    }

    async link(...entities: TEntity[]) {

        const validationFailures = entities.map(w => validateAttachedEntity<TDocumentType, TEntity>(w)).flat().filter(w => w.ok === false);

        if (validationFailures.length > 0) {
            const errors = validationFailures.map(w => w.error).join('\r\n')
            throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`)
        }

        // Find the existing _rev just in case it's not in sync
        const found = await this.api.dbPlugin.getStrict(...entities.map(w => w._id));
        const foundDictionary = found.reduce((a, v) => ({ ...a, [v._id]: v._rev }), {} as IIndexableEntity);
        const result = entities.map(w => this.api.changeTrackingAdapter.enableChangeTracking({ ...w, _rev: foundDictionary[w._id] }, this.defaults.add, this.isReadonly, this.map));

        this.api.changeTrackingAdapter.attach(result);

        return result;
    }

    private _detachItems(data: TEntity[]) {
        return this.api.changeTrackingAdapter.detach(data);
    }
}