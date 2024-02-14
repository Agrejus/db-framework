import { Enrichment, IList, ProcessedChangesResult } from "../../types/change-tracking-types";
import { ITrackedChanges, ITrackedData } from "../../types/context-types";
import { ChangeTrackingOptions, IDbSetProps } from "../../types/dbset-types";
import { IDbRecord, IdRemoval } from "../../types/entity-types";
import { IDbPlugin } from "../../types/plugin-types";
import { EntityEnricher } from './enrichment/EntityEnricher';

export abstract class ChangeTrackingAdapterBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    protected removals: TEntity[] = [];
    protected additions: TEntity[] = [];
    protected removeById: IdRemoval<TDocumentType>[] = [];

    protected abstract attachments: IList<TEntity>;

    abstract getPendingChanges(): ITrackedChanges<TDocumentType, TEntity>;
    abstract merge(from: TEntity, to: TEntity): TEntity;
    abstract markDirty(...entities: TEntity[]): Promise<TEntity[]>;
    abstract processChanges(entity: TEntity): ProcessedChangesResult<TDocumentType, TEntity>;
    abstract asUntracked(...entities: TEntity[]): TEntity[];

    private readonly _enricher: EntityEnricher<TDocumentType, TEntity, TExclusions>;
    readonly enrichment: Enrichment<TDocumentType, TEntity, TExclusions>;

    protected readonly changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>;
    protected readonly dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>;
    protected readonly dbPlugin: IDbPlugin<TDocumentType, TEntity, TExclusions>;
    protected readonly changeTrackingId: string;

    constructor(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>, dbPlugin: IDbPlugin<TDocumentType, TEntity, TExclusions>) {
        this.changeTrackingOptions = changeTrackingOptions;
        this.dbSetProps = dbSetProps;
        this.dbPlugin = dbPlugin;

        this.changeTrackingId = `${this.changeTrackingOptions.contextName}-${this.dbSetProps.documentType}`

        this._enricher = new EntityEnricher(dbSetProps, changeTrackingOptions, dbPlugin);
        this.enrichment = this._enricher.compose();
    }

    isAttached(id: keyof TEntity) {
        return this.attachments.has(id);
    }

    isLinked(entity: TEntity) {
        return this.attachments.get(entity[this.dbPlugin.idPropertyName] as keyof TEntity) === entity;
    }

    reinitialize(removals: TEntity[] = [], add: TEntity[] = [], updates: TEntity[] = []) {
        this.additions = [];
        this.removals = [];
        this.removeById = [];

        this.attachments.remove(...removals);

        // move additions to attachments so we can track changes
        this.attachments.put(...add);
    }

    detach(ids: (keyof TEntity)[]) {
        this.attachments.removeById(...ids);
    }

    attach(...data: TEntity[]) {

        const result: TEntity[] = [];
        const reselectIds: (keyof TEntity)[] = [];

        for (const item of data) {
            const id = item[this.dbPlugin.idPropertyName] as keyof TEntity;

            const found = this.attachments.get(id)

            if (found != null && this.attachments.includes(id) === true && this.processChanges(found).isDirty === true) {
                reselectIds.push(id);
            }

            result.push(item);
            this.attachments.put(item)
        }

        if (reselectIds.length > 0 && this.changeTrackingOptions.environment === "development") {
            console.warn(`Reselect Warning.  Data has been reselected and changed between operations.  Entities should not be changed and then reselected, Db Framework functions return a copy of the entity that should be used in all operations.  Reselecting an item can lead to unwanted and missed changes. - Ids: ${reselectIds.join(', ')}`);
        }

        return result;
    }

    getTrackedData() {
        const result: ITrackedData<TDocumentType, TEntity> = {
            adds: this.additions,
            removes: this.removals,
            attachments: this.attachments,
            removesById: this.removeById
        };

        return result;
    }
}   