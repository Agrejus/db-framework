import { IAttachmentDictionary } from "../../types/change-tracking-types";
import { DeepPartial } from "../../types/common-types";
import { DbFrameworkEnvironment, ITrackedChanges, ITrackedData } from "../../types/context-types";
import { PropertyMap } from "../../types/dbset-builder-types";
import { DbSetMap } from "../../types/dbset-types";
import { IDbRecord, IIndexableEntity, OmittedEntity } from "../../types/entity-types";

export abstract class ChangeTrackingAdapterBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    protected removals: TEntity[] = [];
    protected additions: TEntity[] = [];
    protected removeById: string[] = [];

    protected abstract attachments: IAttachmentDictionary<TDocumentType, TEntity>;

    abstract enableChangeTracking(entity: TEntity, defaults: DeepPartial<OmittedEntity<TEntity, TExclusions>>, readonly: boolean, maps: PropertyMap<TDocumentType, TEntity, any>[]): TEntity;
    abstract getPendingChanges(changes: ITrackedData<TDocumentType, TEntity>, dbsets: DbSetMap): ITrackedChanges<TDocumentType, TEntity>;
    abstract makePristine(...entities: TEntity[]): void;
    abstract merge(from: TEntity, to: TEntity): TEntity;
    abstract markDirty(...entities: TEntity[]): Promise<TEntity[]>;
    abstract isDirty(entity: TEntity): boolean;
    abstract asUntracked(...entities: TEntity[]): TEntity[];

    protected readonly idPropertyName: keyof TEntity;
    protected readonly environment?: DbFrameworkEnvironment;

    constructor(idPropertyName: keyof TEntity, environment?: DbFrameworkEnvironment) {
        this.idPropertyName = idPropertyName;
        this.environment = environment;
    }

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

        const result: TEntity[] = [];
        const reselectIds: (keyof TEntity)[] = [];
        for (const item of data) {
            const id = item[this.idPropertyName] as keyof TEntity;

            const [found] = this.attachments.get(item)

            if (found != null) {
                if (this.attachments.includes(id) === true && this.isDirty(found) === true) {
                    // if the attached item is dirty, it has changed and we issue an error, otherwise return a copy of the referenced item, not the one in the database
                    reselectIds.push(id);
                }

                result.push(found)
                continue;
            } 

            result.push(item);
            this.attachments.push(item)
        }

        if (reselectIds.length > 0 && this.environment === "development") {
            console.warn(`Reselect Error.  Data has been reselected and changed between operations.  Entities should not be changed and then reselected, Db Framework functions return a copy of the entity that should be used in all operations.  Reselecting an item can lead to unwanted and missed changes. - Ids: ${reselectIds.join(', ')}`);
        }

        return result;
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

    mapAndSetDefaults(entity: TEntity | OmittedEntity<TEntity, TExclusions>, maps: PropertyMap<any, any, any>[], defaults: DeepPartial<OmittedEntity<TEntity, TExclusions>> = {} as any) {
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