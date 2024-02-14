import { memoryCache } from "../../../cache/MemoryCache";
import { Enrichment } from "../../../types/change-tracking-types";
import { ChangeTrackingOptions, IDbSetProps } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { IChangeTrackingCache } from "../../../types/memory-cache-types";
import { IBulkOperationsResponse, IDbPlugin } from "../../../types/plugin-types";
import { defaultAddEnrichmentCreator, defaultRetrieveEnrichmentCreator, documentTypeEnrichmentCreator, enhancementEnrichmentCreator, idEnrichmentCreator, deserializerEnrichmentCreator, serializerEnrichmentCreator, stripEnrichmentCreator } from "./enrichers";

export class EntityEnricher<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    private readonly _dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>;
    private readonly _changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>;
    private readonly _changeTrackingId: string;
    private readonly _dbPlugin: IDbPlugin<TDocumentType, TEntity, TExclusions>;

    constructor(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>, dbPlugin: IDbPlugin<TDocumentType, TEntity, TExclusions>) {
        this._dbSetProps = dbSetProps;
        this._changeTrackingOptions = changeTrackingOptions;
        this._changeTrackingId = `${this._changeTrackingOptions.contextName}-${this._dbSetProps.documentType}`;
        this._dbPlugin = dbPlugin;
    }

    compose() {
        const enrichment: Enrichment<TDocumentType, TEntity, TExclusions> = {
            create: () => ({} as any),
            retrieve: () => ({} as any),
            enhance: () => ({} as any),
            deserialize: () => ({} as any),
            upsert: () => ({} as any),
            prepare: () => ({} as any),
            remove: () => ({} as any),
            link: () => ({} as any),
            serialize: () => ({} as any),
            composers: {
                persisted: () => ({} as any)
            }
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
        const [documentTypeEnricher] = documentTypeEnrichmentCreator(this._dbSetProps, props)

        // id enricher
        const [idEnricher] = idEnrichmentCreator(this._dbSetProps, props);

        // default enrich add
        const defaultAddEnrichers = defaultAddEnrichmentCreator(this._dbSetProps, props);

        // default enrich retrieve
        const defaultRetrieveEnrichers = defaultRetrieveEnrichmentCreator(this._dbSetProps, props);

        const stripEnrichers = stripEnrichmentCreator(this._dbSetProps, props);

        const deserializationEnrichers = deserializerEnrichmentCreator(this._dbSetProps, props);
        const serializationEnrichers = serializerEnrichmentCreator(this._dbSetProps, props);
        const enhancementEnrichers = enhancementEnrichmentCreator(this._dbSetProps, props);
        const removalEnricher = this._dbPlugin.enrichRemoval;
        const generatedEnricher = this._dbPlugin.enrichGenerated;


        const create = [documentTypeEnricher, idEnricher, ...defaultAddEnrichers, ...enhancementEnrichers];
        const upsert = [...defaultAddEnrichers, ...deserializationEnrichers, ...enhancementEnrichers];
        const link = [...defaultAddEnrichers, ...enhancementEnrichers];
        const retrieve = [...deserializationEnrichers, ...defaultRetrieveEnrichers, ...enhancementEnrichers];
        const prepare = [...stripEnrichers, ...serializationEnrichers]

        enrichment.create = (entity) => create.reduce((a, v) => v(a), entity);
        enrichment.retrieve = (entity) => retrieve.reduce((a, v) => v(a), entity);
        enrichment.deserialize = (entity) => deserializationEnrichers.reduce((a, v) => v(a), entity);
        enrichment.serialize = (entity) => serializationEnrichers.reduce((a, v) => v(a), entity);
        enrichment.enhance = (entity) => enhancementEnrichers.reduce((a, v) => v(a), entity);
        enrichment.upsert = (entity) => upsert.reduce((a, v) => v(a), entity);
        enrichment.prepare = (entity) => prepare.reduce((a, v) => v(a), entity);
        enrichment.remove = removalEnricher;
        enrichment.link = (entity) => link.reduce((a, v) => v(a), entity);
        enrichment.composers = {
            persisted: (response: IBulkOperationsResponse) => (entity: TEntity) => [...deserializationEnrichers, ...enhancementEnrichers].reduce((a, v) => v(a), generatedEnricher(response, entity))
        }

        memoryCache.put<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this._changeTrackingId, { enrichment });

        return enrichment;
    }

}