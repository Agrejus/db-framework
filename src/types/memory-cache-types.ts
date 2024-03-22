import { IEnrichers } from "./change-tracking-types";
import { IDbRecord } from "./entity-types";

export interface IChangeTrackingCache<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    enrichment: IEnrichers<TDocumentType, TEntity, TExclusions>;
    strip: (entity: TEntity) => TEntity;
    enrichmentPropertyNames: Set<keyof TEntity>;
}