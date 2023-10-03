import { IAttachmentDictionary } from "../../types/change-tracking-types";
import { DeepPartial } from "../../types/common-types";
import { ITrackedChanges, ITrackedData } from "../../types/context-types";
import { PropertyMap } from "../../types/dbset-builder-types";
import { DbSetMap } from "../../types/dbset-types";
import { IDbRecord, IIndexableEntity, OmittedEntity } from "../../types/entity-types";

export abstract class ChangeTrackingAdapterBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {

    protected removals: TEntity[] = [];
    protected additions: TEntity[] = [];
    protected removeById: string[] = [];

    protected abstract attachments: IAttachmentDictionary<TDocumentType, TEntity>;

    abstract enableChangeTracking(entity: TEntity, defaults: DeepPartial<OmittedEntity<TEntity>>, readonly: boolean, maps: PropertyMap<TDocumentType, TEntity, any>[]): TEntity;
    abstract getPendingChanges(changes: ITrackedData<TDocumentType, TEntity>, dbsets: DbSetMap): ITrackedChanges<TDocumentType, TEntity>;
    abstract makePristine(...entities: TEntity[]): void;
    abstract merge(from: TEntity, to: TEntity): TEntity;
    abstract markDirty(...entities: TEntity[]): Promise<TEntity[]>;
    abstract isDirty(entity: TEntity): boolean;
    abstract asUntracked(...entities: TEntity[]): TEntity[];

    reinitialize(removals: TEntity[] = [], add: TEntity[] = [], updates: TEntity[] = []) {
        this.additions = [];
        this.removals = [];
        this.removeById = [];

        this.attachments.remove(...removals);

        // move additions to attachments so we can track changes
        this.attachments.push(...add);
    }

    detach(data: TEntity[]) {
        this.attachments.remove(...data);
    }

    attach(data: TEntity[]) {
        this.attachments.push(...data)
    }

    getTrackedData() {
        const result: ITrackedData<TDocumentType, TEntity> = {
            add: this.additions,
            remove: this.removals,
            attach: this.attachments,
            removeById: this.removeById
        };

        return result;
    }

    mapAndSetDefaults<T extends Object>(entity: T, maps: PropertyMap<any, any, any>[], defaults: DeepPartial<OmittedEntity<T>> = {} as any) {
        const mergedInstance = { ...defaults, ...entity };
        let mappedInstance = {};

        if (maps.length > 0) {
            mappedInstance = maps.reduce((a, v) => {
                const preTransformValue = (mergedInstance as any)[v.property];
                return { ...a, [v.property]: Object.prototype.toString.call(preTransformValue) === '[object Date]' ? preTransformValue : v.map(preTransformValue, entity) }
            }, {});
        }

        return { ...mergedInstance, ...mappedInstance };
    }

    protected mapInstance(entity: TEntity, maps: PropertyMap<TDocumentType, TEntity, any>[]) {

        const result: IIndexableEntity = entity;

        for (const map of maps) {
            result[map.property] = map.map(result[map.property], entity)
        }

        return result as TEntity
    }
}