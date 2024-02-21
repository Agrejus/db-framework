import { IDbSetGeneralAdapter } from '../types/adapter-types';
import { IDbSetChangeTracker } from '../types/change-tracking-types';
import { IDbSetProps, IDbSetInfo, DbSetType } from '../types/dbset-types';
import { IDbRecord, IDbRecordBase } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';

export class DbSetGeneralAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExclusions> implements IDbSetGeneralAdapter<TDocumentType, TEntity, TExclusions> {

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        super(props, type, changeTracker);
    }

    isMatch(first: TEntity, second: any) {
        return this.getKeyFromEntity(first) === this.getKeyFromEntity(second);
    }

    isLinked(entity: TEntity) {
        return this.changeTracker.isLinked(entity);
    }

    match(...items: IDbRecordBase[]) {
        return items.filter(w => w.DocumentType === this.documentType) as TEntity[]
    }

    info() {
        const info: IDbSetInfo<TDocumentType, TEntity, TExclusions> = {
            DocumentType: this.documentType,
            Defaults: this.defaults,
            Readonly: this.isReadonly,
            ChangeTracker: this.changeTracker,
        }

        return info;
    }

    merge(from: TEntity, to: TEntity) {
        return this.changeTracker.merge(from, to);
    }

    unlink(...entities: TEntity[]): void
    unlink(...ids: (keyof TEntity)[]): void
    unlink(...items: any[]) {

        const ids = items.filter(w => typeof w !== "object") as (keyof TEntity)[];

        if (ids.length > 0) {
            this.changeTracker.detach(ids);
        }

        const entities = items.filter(w => typeof w === "object");

        if (entities.length > 0) {
            const response = this.api.dbPlugin.prepareDetachments(...entities);

            if (response.ok === false) {
                const errors = response.errors.join('\r\n')
                throw new Error(`Entities to be unlinked have errors.  Errors: \r\n${errors}`)
            }

            const ids = response.docs.map(w => w[this.api.dbPlugin.idPropertyName]) as (keyof TEntity)[]
            this.changeTracker.detach(ids);
        }
    }

    async markDirty(...entities: TEntity[]) {
        return await this.changeTracker.markDirty(...entities);
    }

    linkUnsafe(...entites: TEntity[]) {
        const enrich = this.changeTracker.enrichment.compose("documentType", "id", "defaultAdd", "changeTracking", "enhance", "destroyChanges");
        const result = entites.map(enrich);
        return this.changeTracker.attach(...result);
    }

    async link(...entities: TEntity[]) {

        const response = await this.api.dbPlugin.prepareAttachments(...entities);

        const alreadyAttached = entities.filter(w => this.changeTracker.isAttached(w[this.api.dbPlugin.idPropertyName] as keyof TEntity) === true);

        if (alreadyAttached.length > 0 && this.api.contextOptions.environment !== "production") {
            console.warn(`DB Framework Warning - Linked entities are already linked.  Ids: ${alreadyAttached.map(w => w[this.api.dbPlugin.idPropertyName]).join(', ')}`)
        }

        if (response.ok === false) {
            const errors = response.errors.join('\r\n')
            throw new Error(`Entities to be linked have errors.  Errors: \r\n${errors}`)
        }

        return this.changeTracker.link(response.docs, entities);
    }
}