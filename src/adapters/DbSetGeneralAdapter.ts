import { IDbSetGeneralAdapter } from '../types/adapter-types';
import { IDbSetProps, IDbSetInfo, DbSetType } from '../types/dbset-types';
import { IDbRecord, IDbRecordBase } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';

export class DbSetGeneralAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExclusions> implements IDbSetGeneralAdapter<TDocumentType, TEntity, TExclusions> {

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType) {
        super(props, type);
    }

    isMatch(first: TEntity, second: any) {
        return this.getKeyFromEntity(first) === this.getKeyFromEntity(second);
    }

    match(...items: IDbRecordBase[]) {
        return items.filter(w => w.DocumentType === this.documentType) as TEntity[]
    }

    info() {
        const info: IDbSetInfo<TDocumentType, TEntity, TExclusions> = {
            DocumentType: this.documentType,
            IdKeys: this.idKeys,
            Defaults: this.defaults,
            KeyType: this.keyType,
            Readonly: this.isReadonly,
            Map: this.map,
            ChangeTracker: this.changeTracker
        }

        return info;
    }

    merge(from: TEntity, to: TEntity) {
        return this.changeTracker.merge(from, to);
    }

    unlink(...entities: TEntity[]) {

        const response = this.api.dbPlugin.prepareDetachments(...entities);

        if (response.ok === false) {
            const errors = response.errors.join('\r\n')
            throw new Error(`Entities to be unlinked have errors.  Errors: \r\n${errors}`)
        }

        this._detachItems(response.docs)
    }

    async markDirty(...entities: TEntity[]) {
        return await this.changeTracker.markDirty(...entities);
    }

    async link(...entities: TEntity[]) {

        const response = await this.api.dbPlugin.prepareAttachments(...entities);

        if (response.ok === false) {
            const errors = response.errors.join('\r\n')
            throw new Error(`Entities to be linked have errors.  Errors: \r\n${errors}`)
        }

        const result = response.docs.map(w => this.changeTracker.enableChangeTracking(w, this.defaults.add, this.isReadonly, this.map));
        return this.changeTracker.attach(result);
    }

    private _detachItems(data: TEntity[]) {
        return this.changeTracker.detach(data);
    }
}