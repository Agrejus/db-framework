import { memoryCache } from "../../../cache/MemoryCache";
import { Enrichment } from "../../../types/change-tracking-types";
import { ChangeTrackingOptions, IDbSetProps } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { IChangeTrackingCache } from "../../../types/memory-cache-types";
import { IBulkOperationsResponse, IDbPlugin } from "../../../types/plugin-types";
import { defaultAddEnrichmentCreator, defaultRetrieveEnrichmentCreator, documentTypeEnrichmentCreator, enhancementEnrichmentCreator, idEnrichmentCreator, mapEnrichmentCreator, stripEnrichmentCreator } from "./enrichers";

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
            add: () => ({} as any),
            retrieve: () => ({} as any),
            enhance: () => ({} as any),
            map: () => ({} as any),
            upsert: () => ({} as any),
            strip: () => ({} as any),
            remove: () => ({} as any),
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
        const [defaultAddEnricher] = defaultAddEnrichmentCreator(this._dbSetProps, props);

        // default enrich retrieve
        const [defaultRetrieveEnricher] = defaultRetrieveEnrichmentCreator(this._dbSetProps, props);

        const [stripEnricher] = stripEnrichmentCreator(this._dbSetProps, props);

        const mapEnrichers = mapEnrichmentCreator(this._dbSetProps, props);
        const [enhancementEnricher] = enhancementEnrichmentCreator(this._dbSetProps, props);
        const removalEnricher = this._dbPlugin.enrichRemoval;
        const generatedEnricher = this._dbPlugin.enrichGenerated;


        const add = [documentTypeEnricher, idEnricher, defaultAddEnricher, ...mapEnrichers, enhancementEnricher];
        const upsert = [defaultAddEnricher, ...mapEnrichers, enhancementEnricher];
        const retrieve = [defaultRetrieveEnricher, ...mapEnrichers, enhancementEnricher];

        enrichment.add = (entity) => add.reduce((a, v) => v(a), entity);
        enrichment.retrieve = (entity) => retrieve.reduce((a, v) => v(a), entity);
        enrichment.map = (entity) => mapEnrichers.reduce((a, v) => v(a), entity);
        enrichment.enhance = enhancementEnricher;
        enrichment.upsert = (entity) => upsert.reduce((a, v) => v(a), entity);
        enrichment.strip = stripEnricher;
        enrichment.remove = removalEnricher;
        enrichment.composers = {
            persisted: (response: IBulkOperationsResponse) => (entity: TEntity) => [...mapEnrichers, enhancementEnricher].reduce((a, v) => v(a), generatedEnricher(response, entity))
        }

        memoryCache.put<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this._changeTrackingId, { enrichment });

        return enrichment;
    }

}