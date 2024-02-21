import { List } from "../../common/List";
import { Transaction } from "../../common/Transaction";
import { IList, IDbSetChangeTracker, ProcessedChangesResult } from "../../types/change-tracking-types";
import { DeepPartial, EntityComparator } from "../../types/common-types";
import { ITrackedChanges, IProcessedUpdates } from "../../types/context-types";
import { ChangeTrackingOptions, IDbSetProps } from "../../types/dbset-types";
import { IDbRecord } from "../../types/entity-types";
import { IDbPlugin } from "../../types/plugin-types";
import { ChangeTrackingAdapterBase } from "./ChangeTrackingAdapterBase";

/**
 * Uses custom object comparison defined by the developer, which is tracked at the context level.  Useful for applications that have trouble with proxy objects
 */
export class CustomChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends ChangeTrackingAdapterBase<TDocumentType, TEntity, TExclusions> implements IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> {

    protected override attachments;
    private _originals: IList<TEntity>;
    private _comparator: EntityComparator<TDocumentType, TEntity>;
    private _dirtyMarkers: { [key in keyof TEntity]: true } = {} as any;

    constructor(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>, dbPlugin: IDbPlugin<TDocumentType, TEntity, TExclusions>, comparator: EntityComparator<TDocumentType, TEntity>) {
        super(dbSetProps, changeTrackingOptions, dbPlugin);
        this.attachments = new List<TEntity>(dbPlugin.idPropertyName);
        this._originals = new List<TEntity>(dbPlugin.idPropertyName);
        this._comparator = comparator;
    }

    link(foundEntities: TEntity[], attachEntities: TEntity[]): TEntity[] {
        const enrich = this.enrichment.compose("documentType", "id", "defaultAdd", "enhance", "destroyChanges");
        const attachedEntitiesMap = attachEntities.reduce((a, v) => {
            const id = v[this.dbPlugin.idPropertyName] as string | number;

            return { ...a, [id]: v }
        }, {} as { [key: string | number]: TEntity })
        const result = foundEntities.map(w => {
            const id = w[this.dbPlugin.idPropertyName] as string | number;

            return {
                ...enrich(w),
                ...attachedEntitiesMap[id]
            };
        });

        return this.attach(...result);
    }

    asUntracked(...entities: TEntity[]) {
        return entities;
    }

    processChanges(entity: TEntity): ProcessedChangesResult<TDocumentType, TEntity> {

        const id = entity[this.dbPlugin.idPropertyName] as keyof TEntity;
        const original = this._originals.get(id);
        const now = Transaction.now();

        if (this._dirtyMarkers[id] === true || original == null) {

            return {
                isDirty: true,
                deltas: { ...entity, [this.dbPlugin.idPropertyName]: id } as DeepPartial<TEntity>,
                doc: entity,
                original: entity,
                timestamp: now
            }; // mark as dirty so we save it
        }

        const deltas = this._comparator(original, entity);
        const isDirty = deltas != null;

        return {
            isDirty,
            deltas: { ...deltas, [this.dbPlugin.idPropertyName]: original[this.dbPlugin.idPropertyName] },
            doc: entity,
            original: entity,
            timestamp: now
        }
    }

    private _pushOriginals(...data: TEntity[]) {
        const enrich = this.enrichment.compose("deserialize");
        const clonedItems = JSON.parse(JSON.stringify(data)) as TEntity[];
        const clonedAndMappedItems = clonedItems.map(enrich);
        this._originals.put(...clonedAndMappedItems)
    }

    override reinitialize(removals: TEntity[] = [], add: TEntity[] = [], updates: TEntity[] = []): void {
        super.reinitialize(removals, add, updates);

        this._dirtyMarkers = {} as any;

        this._originals = new List<TEntity>(this.dbPlugin.idPropertyName);
        this._pushOriginals(...this.attachments.all())
    }

    override attach(...data: TEntity[]) {
        this._pushOriginals(...data);
        return super.attach(...data);
    }

    getPendingChanges(): ITrackedChanges<TDocumentType, TEntity> {

        const changes = this.getTrackedData();
        const { adds, removes, removesById, attachments, transactions } = changes;

        const updates = attachments
            .map(w => this.processChanges(w))
            .filter(w => w.isDirty === true)
            .map(w => {
                w.deltas = w.deltas;
                w.doc = { ...w.doc, ...w.deltas }; // write mapping changes to the main doc
                return w;
            })
            .reduce((a, v) => {

                const id = v.doc[this.dbPlugin.idPropertyName] as string | number;
                a.docs[id] = v.doc;
                a.deltas[id] = v.deltas;
                a.originals[id] = v.original;
                a.timestamp[id] = v.timestamp;

                return a;
            }, { deltas: {}, docs: {}, originals: {}, timestamp: {}, timestamps: {} } as IProcessedUpdates<TDocumentType, TEntity>);

        return {
            adds,
            removes,
            removesById,
            updates,
            transactions
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
            const id = item[this.dbPlugin.idPropertyName] as keyof TEntity;
            this._dirtyMarkers[id] = true
        }

        return entities;
    }
}