import { ReselectDictionary } from "../../common/ReselectDictionary";
import { IDbSetChangeTracker, ProcessedChangesResult } from "../../types/change-tracking-types";
import { ITrackedChanges } from "../../types/context-types";
import { ChangeTrackingOptions, IDbSetProps } from "../../types/dbset-types";
import { IDbRecord } from "../../types/entity-types";
import { IDbPlugin } from "../../types/plugin-types";
import { EntityChangeTrackingAdapter } from "./EntityChangeTrackingAdapter";

/**
 * Throws out all changes since it is read only
 */
export class ReadonlyChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends EntityChangeTrackingAdapter<TDocumentType, TEntity, TExclusions> implements IDbSetChangeTracker<TDocumentType, TEntity, TExclusions> {

    protected override attachments;

    constructor(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>, dbPlugin: IDbPlugin<TDocumentType, TEntity, TExclusions>) {
        super(dbSetProps, changeTrackingOptions, dbPlugin);
        this.attachments = new ReselectDictionary<TDocumentType, TEntity>(dbPlugin.idPropertyName)
    }

    override asUntracked(...entities: TEntity[]) {
        return entities;
    }

    override processChanges(_: TEntity): ProcessedChangesResult<TDocumentType, TEntity> {
        return {
            isDirty: false,
            deltas: null,
            doc: null,
            original: null
        }
    }

    override attach(data: TEntity[]) {
        return data;
    }

    override getPendingChanges(): ITrackedChanges<TDocumentType, TEntity> {

        const changes = this.getTrackedData();
        const { add } = changes;

        return {
            add,
            remove: [],
            removeById: [],
            updated: { deltas: {}, docs: {}, originals: {} }
        }
    }

    override async markDirty(...entities: TEntity[]) {
        return entities;
    }
}