import { memoryCache } from "../../../cache/MemoryCache";
import { IEnrichmentComposer, IEnrichers, IComposeEnrichers, EnrichmentPick } from "../../../types/change-tracking-types";
import { ChangeTrackingOptions, IDbSetProps } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { IChangeTrackingCache } from "../../../types/memory-cache-types";
import { IBulkOperationsResponse, IDbPlugin } from "../../../types/plugin-types";
import { defaultAddEnrichmentCreator, defaultRetrieveEnrichmentCreator, documentTypeEnrichmentCreator, enhancementEnrichmentCreator, idEnrichmentCreator, deserializerEnrichmentCreator, serializerEnrichmentCreator, stripEnrichmentCreator, destroyEnhancedEnrichmentCreator } from "./enrichers";

export class EntityEnricher<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> implements IEnrichmentComposer<TDocumentType, TEntity, TExclusions> {

    private readonly _dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>;
    private readonly _changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>;
    private readonly _changeTrackingId: string;
    private readonly _dbPlugin: IDbPlugin<TDocumentType, TEntity, TExclusions>;
    private readonly _enrichers: IEnrichers<TDocumentType, TEntity, TExclusions>;
    readonly composers: IComposeEnrichers<TDocumentType, TEntity, TExclusions> = {} as any;

    constructor(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>, dbPlugin: IDbPlugin<TDocumentType, TEntity, TExclusions>, enableChangeTracking: (entity: TEntity) => TEntity) {
        this._dbSetProps = dbSetProps;
        this._changeTrackingOptions = changeTrackingOptions;
        this._changeTrackingId = `${this._changeTrackingOptions.contextName}-${this._dbSetProps.documentType}`;
        this._dbPlugin = dbPlugin;

        const generatedEnricher = this._dbPlugin.enrichGenerated;
        this.composers = {
            persisted: (response: IBulkOperationsResponse) => (entity: TEntity) => generatedEnricher(response, entity)
        }
        this._enrichers = this._compose(enableChangeTracking);
    }

    compose(...enrichers: EnrichmentPick<TDocumentType, TEntity, TExclusions>[]): (entity: TEntity) => TEntity {
        return (entity) => enrichers.map(w => typeof w === "string" ? this._enrichers[w] : w).reduce((a, v) => v(a), entity);
    }

    _compose(enableChangeTracking: (entity: TEntity) => TEntity) {
        const enrichment: IEnrichers<TDocumentType, TEntity, TExclusions> = {
            defaultAdd: (entity) => entity,
            defaultRetrieve: (entity) => entity,
            deserialize: (entity) => entity,
            serialize: (entity) => entity,
            enhance: (entity) => entity,
            strip: (entity) => entity,
            documentType: (entity) => entity,
            id: (entity) => entity,
            remove: (entity) => entity,
            changeTracking: (entity) => entity,
            destroyChanges: (entity) => entity
        }

        const cache = memoryCache.get<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this._changeTrackingId);

        if (cache?.enrichment != null) {
            return cache.enrichment
        }

        const props = {
            untrackedPropertyNames: this._changeTrackingOptions.untrackedPropertyNames,
            idPropertyName: this._dbPlugin.idPropertyName,
            changeTrackingId: this._changeTrackingId
        }

        // document type enricher
        const documentTypeEnricher = documentTypeEnrichmentCreator(this._dbSetProps, props)

        // id enricher
        const idEnricher = idEnrichmentCreator(this._dbSetProps, props);

        // default enrich add
        const defaultAddEnrichers = defaultAddEnrichmentCreator(this._dbSetProps, props);

        // default enrich retrieve
        const defaultRetrieveEnrichers = defaultRetrieveEnrichmentCreator(this._dbSetProps, props);

        const stripEnrichers = stripEnrichmentCreator(this._dbSetProps, props);

        const deserializationEnrichers = deserializerEnrichmentCreator(this._dbSetProps, props);
        const serializationEnrichers = serializerEnrichmentCreator(this._dbSetProps, props);
        const enhancementEnricher = enhancementEnrichmentCreator(this._dbSetProps, props);
        const destroyChangesEnrichers = destroyEnhancedEnrichmentCreator(this._dbSetProps, props);
        const removalEnricher = this._dbPlugin.enrichRemoval;

        enrichment.defaultAdd = (entity) => defaultAddEnrichers.reduce((a, v) => v(a), entity);
        enrichment.defaultRetrieve = (entity) => defaultRetrieveEnrichers.reduce((a, v) => v(a), entity);
        enrichment.deserialize = (entity) => deserializationEnrichers.reduce((a, v) => v(a), entity);
        enrichment.serialize = (entity) => serializationEnrichers.reduce((a, v) => v(a), entity);
        enrichment.enhance = (entity) => enhancementEnricher.reduce((a, v) => v(a), entity);
        enrichment.strip = (entity) => stripEnrichers.reduce((a, v) => v(a), entity);
        enrichment.changeTracking = (entity) => enableChangeTracking(entity);
        enrichment.documentType = (entity) => documentTypeEnricher.reduce((a, v) => v(a), entity);
        enrichment.id = (entity) => idEnricher.reduce((a, v) => v(a), entity);
        enrichment.remove = (entity) => removalEnricher(entity);
        enrichment.destroyChanges = (entity) => destroyChangesEnrichers.reduce((a, v) => v(a), entity);

        memoryCache.put<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this._changeTrackingId, { enrichment });

        return enrichment;
    }

}