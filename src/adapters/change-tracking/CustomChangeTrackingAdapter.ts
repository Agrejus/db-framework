import { ReselectDictionary } from "../../common/ReselectDictionary";
import { IAttachmentDictionary, IDbSetChangeTracker, ProcessedChangesResult } from "../../types/change-tracking-types";
import { DeepPartial, EntityComparator } from "../../types/common-types";
import { ITrackedChanges, IEntityUpdates } from "../../types/context-types";
import { ChangeTrackingOptions, IDbSetProps } from "../../types/dbset-types";
import { IDbRecord } from "../../types/entity-types";
import { ChangeTrackingAdapterBase } from "./ChangeTrackingAdapterBase";

/**
 * Uses custom object comparison defined by the developer, which is tracked at the context level.  Useful for applications that have trouble with proxy objects
 */
export class CustomChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends ChangeTrackingAdapterBase<TDocumentType, TEntity, TExclusions> implements IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> {

    protected override attachments;
    private _originals: IAttachmentDictionary<TDocumentType, TEntity>;
    private _comparator: EntityComparator<TDocumentType, TEntity>;
    private _dirtyMarkers: { [key in keyof TEntity]: true } = {} as any;

    constructor(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>, comparator: EntityComparator<TDocumentType, TEntity>) {
        super(dbSetProps, changeTrackingOptions);
        this.attachments = new ReselectDictionary<TDocumentType, TEntity>(changeTrackingOptions.idPropertyName);
        this._originals = new ReselectDictionary<TDocumentType, TEntity>(changeTrackingOptions.idPropertyName);
        this._comparator = comparator;
    }

    link(foundEntities: TEntity[], attachEntities: TEntity[]): TEntity[] {
        const attachedEntitiesMap = attachEntities.reduce((a, v) => {
            const id = v[this.changeTrackingOptions.idPropertyName] as string | number;

            return { ...a, [id]: v }
        }, {} as { [key: string | number]: TEntity })
        const result = foundEntities.map(w => {
            const id = w[this.changeTrackingOptions.idPropertyName] as string | number;

            return {
                ...this.enrichment.add(w),
                ...attachedEntitiesMap[id]
            };
        });

        return this.attach(result);
    }

    asUntracked(...entities: TEntity[]) {
        return entities;
    }

    processChanges(entity: TEntity): ProcessedChangesResult<TDocumentType, TEntity> {

        const id = entity[this.changeTrackingOptions.idPropertyName] as keyof TEntity;
        const original = this._originals.get(id);

        if (this._dirtyMarkers[id] === true || original == null) {
            return {
                isDirty: true,
                deltas: { ...entity, [this.changeTrackingOptions.idPropertyName]: id } as DeepPartial<TEntity>,
                doc: entity,
                original: entity
            }; // mark as dirty so we save it
        }

        const deltas = this._comparator(original, entity);
        const isDirty = deltas != null;

        return {
            isDirty,
            deltas: { ...deltas, [this.changeTrackingOptions.idPropertyName]: original[this.changeTrackingOptions.idPropertyName] },
            doc: entity,
            original: entity
        }
    }

    private _pushOriginals(...data: TEntity[]) {
        const clonedItems = JSON.parse(JSON.stringify(data)) as TEntity[];
        const clonedAndMappedItems = clonedItems.map(w => this.enrichment.map(w) as TEntity);
        this._originals.push(...clonedAndMappedItems)
    }

    override reinitialize(removals: TEntity[] = [], add: TEntity[] = [], updates: TEntity[] = []): void {
        super.reinitialize(removals, add, updates);

        this._dirtyMarkers = {} as any;

        this._originals = new ReselectDictionary<TDocumentType, TEntity>(this.changeTrackingOptions.idPropertyName);
        this._pushOriginals(...this.attachments.all())
    }

    override attach(data: TEntity[]) {
        this._pushOriginals(...data);
        return super.attach(data);
    }

    getPendingChanges(): ITrackedChanges<TDocumentType, TEntity> {

        const changes = this.getTrackedData();
        const { add, remove, removeById, attach } = changes;

        const updated = attach
            .map(w => this.processChanges(w))
            .filter(w => w.isDirty === true)
            .map(w => {
                w.deltas = this.enrichment.map(w.deltas as TEntity) as DeepPartial<TEntity>;
                w.doc = { ...w.doc, ...w.deltas }; // write mapping changes to the main doc
                return w;
            })
            .reduce((a, v) => {

                const id = v.doc[this.changeTrackingOptions.idPropertyName] as string | number;
                a.docs[id] = v.doc;
                a.deltas[id] = v.deltas;
                a.originals.push(v.original);
                return a;
            }, { deltas: {}, docs: {}, originals: [] } as IEntityUpdates<TDocumentType, TEntity>);

        return {
            add,
            remove,
            removeById,
            updated
        }
    }

    enableChangeTracking(entity: TEntity) {
        return entity
    }

    merge(from: TEntity, to: TEntity) {
        for (let property in from) {
            to[property] = from[property];
        }

        return to;
    }

    async markDirty(...entities: TEntity[]) {

        for (const item of entities) {
            const id = item[this.changeTrackingOptions.idPropertyName] as keyof TEntity;
            this._dirtyMarkers[id] = true
        }

        return entities;
    }
}