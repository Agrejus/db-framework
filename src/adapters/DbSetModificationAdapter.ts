import { IDbSetModificationAdapter } from '../types/adapter-types';
import { IDbSetChangeTracker } from '../types/change-tracking-types';
import { DbSetType, IDbSetProps } from '../types/dbset-types';
import { IDbRecord, OmittedEntity, IIndexableEntity } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';

export class DbSetModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExclusions> implements IDbSetModificationAdapter<TDocumentType, TEntity, TExclusions> {

    private _tag: unknown | null = null;

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType, changeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>) {
        super(props, type, changeTracker);
    }

    tag(value: unknown) {
        this._tag = value;
    }

    instance(...entities: OmittedEntity<TEntity, TExclusions>[]) {
        return entities.map(entity => ({ ...this.changeTracker.enrichment.create(entity as TEntity) }));
    }

    private async _add(...entities: OmittedEntity<TEntity, TExclusions>[]) {
        const data = this.changeTracker.getTrackedData();
        const { adds } = data;

        const result = entities.map(entity => {

            const canAddEntityResult = this.api.dbPlugin.isOperationAllowed(entity as any, "add");

            if (canAddEntityResult.ok === false) {
                throw new Error(canAddEntityResult.error ?? 'Cannot add entity')
            }

            const enrichedEntity = this.changeTracker.enrichment.create(entity as TEntity);
            const [trackableEntity] = this.changeTracker.enableChangeTracking(enrichedEntity);

            this._tryAddMetaData(trackableEntity[this.api.dbPlugin.idPropertyName]);

            adds.push(trackableEntity);

            return trackableEntity;
        });

        return result
    }

    async add(...entities: OmittedEntity<TEntity, TExclusions>[]) {

        const result = await this._add(...entities);

        this._disposeMetaData();

        return result
    }

    private _tryAddMetaData(id: TEntity[keyof TEntity]) {
        if (this._tag != null) {
            this.api.tag(id, this._tag)
        }
    }

    private _disposeMetaData() {
        this._tag = null;
    }

    async upsert(...entities: (OmittedEntity<TEntity, TExclusions> | Omit<TEntity, "DocumentType">)[]) {

        const all = await this.getAllData();
        const allDictionary: { [key: string]: TEntity } = all.reduce((a, v) => {

            const id = v[this.api.dbPlugin.idPropertyName] as string;
            return { ...a, [id]: v }
        }, {})
        const result: TEntity[] = [];

        for (let entity of entities as any[]) {
            const instance = entity[this.api.dbPlugin.idPropertyName] != null ? entity as TEntity : this.changeTracker.enrichment.create(entity) as TEntity;
            const id = instance[this.api.dbPlugin.idPropertyName] as string;
            const found = allDictionary[id]

            if (found) {
                const enriched = this.changeTracker.enrichment.upsert(found);
                const [mergedAndTrackable] = this.changeTracker.enableChangeTracking(enriched);
                const [attached] = this.changeTracker.attach(mergedAndTrackable);

                try {
                    this.changeTracker.merge(entity, attached);
                } catch (e: any) {
                    if ('message' in e && typeof e.message === "string" && e.message.includes("object is not extensible")) {
                        throw new Error(`Cannot change property on readonly entity.  Readonly DbSets can only be added to, not updated, consider removing readonly from the DbSet.  DocumentType: ${this.documentType}.  Original Error: ${e.message}`)
                    }
                    throw e;
                }

                const mergedId = attached[this.api.dbPlugin.idPropertyName];
                this._tryAddMetaData(mergedId);

                result.push(attached)
                continue;
            }

            const [added] = await this._add(entity);

            result.push(added)
        }

        this._disposeMetaData();

        return result;
    }

    async remove(...ids: string[]): Promise<void>;
    async remove(...entities: TEntity[]): Promise<void>;
    async remove(...entities: any[]) {

        await this.onRemove();

        if (entities.some(w => typeof w === "string")) {
            await Promise.all(entities.map(w => this._removeById(w)));

            this._disposeMetaData();
            return;
        }

        await Promise.all(entities.map(w => this._remove(w)))

        this._disposeMetaData();
    }

    protected async onRemove() {

    }

    async empty() {
        const items = await this._all();
        await this.remove(...items);
    }

    private async _remove(entity: TEntity) {
        const data = this.changeTracker.getTrackedData();
        const { removes } = data;

        const ids = removes.map(w => w[this.api.dbPlugin.idPropertyName]);
        const indexableEntity = entity as IIndexableEntity;

        if (ids.includes(indexableEntity[this.api.dbPlugin.idPropertyName as string])) {
            throw new Error(`Cannot remove entity with same id more than once.  id: ${indexableEntity[this.api.dbPlugin.idPropertyName as string]}`)
        }

        const canAddEntityResult = this.api.dbPlugin.isOperationAllowed(entity, "remove");

        if (canAddEntityResult.ok === false) {
            throw new Error(canAddEntityResult.error ?? 'Cannot remove entity')
        }

        this._tryAddMetaData(entity[this.api.dbPlugin.idPropertyName]);
        removes.push(entity as any);
    }

    protected async _removeById(id: string) {
        const data = this.changeTracker.getTrackedData();
        const { removesById } = data;

        if (removesById.map(w => w.key).includes(id)) {
            throw new Error(`Cannot remove entity with same id more than once.  id: ${id}`)
        }

        this._tryAddMetaData(id as any);

        removesById.push({ key: id, DocumentType: this.documentType });
    }
}