import { DeepPartial } from "./common-types";
import { PropertyMap } from "./dbset-builder-types";
import { IDbRecord, OmittedEntity } from "./entity-types";

export interface IChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    enableChangeTracking(entity: TEntity, defaults: DeepPartial<OmittedEntity<TEntity>>, readonly: boolean, maps: PropertyMap<TDocumentType, TEntity, any>[]): TEntity;
}