import { Enrichment, EntityReverter } from "./change-tracking-types";
import { IDbRecord } from "./entity-types";

export interface IChangeTrackingCache<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    reverter: EntityReverter<TDocumentType, TEntity, TExclusions>;
    enrichment: Enrichment<TDocumentType, TEntity, TExclusions>;
}