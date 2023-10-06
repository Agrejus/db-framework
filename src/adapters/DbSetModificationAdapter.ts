import { IDbSetModificationAdapter } from '../types/adapter-types';
import { DbSetType, IDbSetProps } from '../types/dbset-types';
import { IDbRecord, OmittedEntity, IIndexableEntity } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';

export class DbSetModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExclusions> implements IDbSetModificationAdapter<TDocumentType, TEntity, TExclusions> {

    private _tag: unknown | null = null; 

    constructor(props: IDbSetProps<TDocumentType, TEntity, TExclusions>, type: DbSetType) {
        super(props, type);
    }

    protected processAddition(entity: OmittedEntity<TEntity, TExclusions>) {
        const addItem: IDbRecord<TDocumentType> = entity as any;
        (addItem as any).DocumentType = this.documentType;
        const id = this.getKeyFromEntity(entity as any);

        

        if (id != undefined) {
            (addItem as any)[this.api.dbPlugin.idPropertName] = id;
        }

        return addItem
    }

    protected processAdditionAndMakeTrackable(entity: OmittedEntity<TEntity, TExclusions>) {
        const addItem = this.processAddition(entity);

        return this.api.changeTrackingAdapter.enableChangeTracking(addItem as TEntity, this.defaults.add, this.isReadonly, this.map);
    }

    tag(value: unknown) {
        this._tag = value;
    }

    instance(...entities: OmittedEntity<TEntity, TExclusions>[]) {
        return entities.map(entity => ({ ...this.processAdditionAndMakeTrackable(entity) }));
    }

    private async _add(...entities: OmittedEntity<TEntity, TExclusions>[]) {
        const data = this.api.changeTrackingAdapter.getTrackedData();
        const { add } = data;

        const result = entities.map(entity => {

            if (this.api.dbPlugin.isOperationAllowed(entity as any, "add") === false) {
                throw new Error('Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity')
            }

            const mappedEntity = this.api.changeTrackingAdapter.mapAndSetDefaults(entity, this.map, this.defaults.add);
            const trackableEntity = this.processAdditionAndMakeTrackable(mappedEntity);
            
            this._tryAddMetaData(trackableEntity[this.api.dbPlugin.idPropertName]);

            add.push(trackableEntity);

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

            const id = v[this.api.dbPlugin.idPropertName] as string;
            return { ...a, [id]: v }
        }, {})
        const result: TEntity[] = [];

        for (let entity of entities as any[]) {
            const instance = entity[this.api.dbPlugin.idPropertName] != null ? entity as TEntity : { ...this.processAdditionAndMakeTrackable(entity) } as TEntity;
            const id = instance[this.api.dbPlugin.idPropertName] as string;
            const found = allDictionary[id]

            if (found) {
                const mergedAndTrackable = this.api.changeTrackingAdapter.enableChangeTracking(found, this.defaults.add, this.isReadonly, this.map);

                this.api.changeTrackingAdapter.attach([mergedAndTrackable]);

                try {
                    this.api.changeTrackingAdapter.merge(entity, mergedAndTrackable);
                } catch(e: any) {
                    if ('message' in e && typeof e.message === "string" && e.message.includes("object is not extensible")) {
                        throw new Error(`Cannot change property on readonly entity.  Readonly DbSets can only be added to, not updated, consider removing readonly from the DbSet.  DocumentType: ${this.documentType}.  Original Error: ${e.message}`)
                    }
                    throw e;
                }

                const mergedId = mergedAndTrackable[this.api.dbPlugin.idPropertName];
                this._tryAddMetaData(mergedId);

                result.push(mergedAndTrackable)
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
        const data = this.api.changeTrackingAdapter.getTrackedData();
        const { remove } = data;

        const ids = remove.map(w => w[this.api.dbPlugin.idPropertName]);
        const indexableEntity = entity as IIndexableEntity;

        if (ids.includes(indexableEntity[this.api.dbPlugin.idPropertName as string])) {
            throw new Error(`Cannot remove entity with same id more than once.  id: ${indexableEntity[this.api.dbPlugin.idPropertName as string]}`)
        }

        this._tryAddMetaData(entity[this.api.dbPlugin.idPropertName]);
        remove.push(entity as any);
    }

    protected async _removeById(id: string) {
        const data = this.api.changeTrackingAdapter.getTrackedData();
        const { removeById } = data;

        if (removeById.includes(id)) {
            throw new Error(`Cannot remove entity with same id more than once.  id: ${id}`)
        }

        this._tryAddMetaData(id as any);
        removeById.push(id);
    }
}