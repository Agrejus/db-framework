import { Enrichment, IAttachmentDictionary, ProcessedChangesResult } from "../../types/change-tracking-types";
import { ITrackedChanges, ITrackedData } from "../../types/context-types";
import { EntityEnhancer } from "../../types/dbset-builder-types";
import { ChangeTrackingOptions } from "../../types/dbset-types";
import { IDbRecord, IdRemoval, OmittedEntity } from "../../types/entity-types";
import { memoryCache } from '../../cache/MemoryCache';
import { IChangeTrackingCache } from '../../types/memory-cache-types';

export abstract class ChangeTrackingAdapterBase<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {

    protected removals: TEntity[] = [];
    protected additions: TEntity[] = [];
    protected removeById: IdRemoval<TDocumentType>[] = [];

    protected abstract attachments: IAttachmentDictionary<TDocumentType, TEntity>;

    abstract getPendingChanges(): ITrackedChanges<TDocumentType, TEntity>;
    abstract merge(from: TEntity, to: TEntity): TEntity;
    abstract markDirty(...entities: TEntity[]): Promise<TEntity[]>;
    abstract processChanges(entity: TEntity): ProcessedChangesResult<TDocumentType, TEntity>;
    abstract asUntracked(...entities: TEntity[]): TEntity[];

    readonly enrichment: Enrichment<TDocumentType, TEntity, TExclusions>;

    protected readonly options: ChangeTrackingOptions<TDocumentType, TEntity, TExclusions>;
    protected readonly changeTrackingId: string;

    constructor(options: ChangeTrackingOptions<TDocumentType, TEntity, TExclusions>) {
        this.options = options;

        this.changeTrackingId = `${this.options.contextName}-${this.options.documentType}`

        // compose enrichers
        this.enrichment = this._composeEnrichers();
    }

    private _composeEnrichers() {
        const enrichment: Enrichment<TDocumentType, TEntity, TExclusions> = {
            add: () => void (0),
            retrieve: () => void (0),
            enhance: () => void (0),
            map: () => void (0),
        }

        const cache = memoryCache.get<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this.changeTrackingId);

        if (cache?.enrichment != null) {
            return cache.enrichment
        }

        // id enricher
        const idEnricher = (entity: TEntity) => {
            return { ...entity, [this.options.idPropertyName]: this.options.idCreator(entity) } as TEntity;
        }

        // document type enricher
        const documentTypeEnricher = (entity: TEntity) => {
            return { ...entity, DocumentType: this.options.documentType } as TEntity;
        }

        // default enrich first
        const defaultAddEnricher = (entity: TEntity) => {
            return { ...this.options.defaults.add, ...entity } as TEntity;
        }

        const defaultRetrieveEnricher = (entity: TEntity) => {
            return { ...this.options.defaults.retrieve, ...entity } as TEntity;
        }

        const mapEnrichers: ((entity: TEntity) => TEntity)[] = [];
        const enhancementEnrichers: ((entity: TEntity) => TEntity)[] = [];

        // add mappings
        if (this.options.map.length > 0) {
            const propertyMapEnrichers = this.options.map.map(w => (entity: TEntity) => {
                const preTransformedValue = (entity)[w.property as keyof TEntity];
                const value = Object.prototype.toString.call(preTransformedValue) === '[object Date]' ? preTransformedValue : w.map(preTransformedValue as any, entity)

                return { ...entity, [w.property]: value } as TEntity;
            });

            mapEnrichers.push(...propertyMapEnrichers)
        }

        // add enhancers last
        if (this.options.enhancer != null) {
            enhancementEnrichers.push(this.options.enhancer)
        }

        const add = [idEnricher, documentTypeEnricher, defaultAddEnricher, ...mapEnrichers, ...enhancementEnrichers];
        const retrieve = [defaultRetrieveEnricher, ...mapEnrichers, ...enhancementEnrichers];

        enrichment.add = (entity) => add.reduce((a, v) => v(a), entity);
        enrichment.retrieve = (entity) => retrieve.reduce((a, v) => v(a), entity);
        enrichment.map = (entity) => mapEnrichers.reduce((a, v) => v(a), entity);
        enrichment.enhance = (entity) => enhancementEnrichers.reduce((a, v) => v(a), entity);

        memoryCache.put<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this.changeTrackingId, { enrichment });

        return enrichment;
    }

    isAttached(id: keyof TEntity) {
        return this.attachments.has(id);
    }

    isLinked(entity: TEntity) {
        return this.attachments.get(entity[this.options.idPropertyName] as keyof TEntity) === entity;
    }

    reinitialize(removals: TEntity[] = [], add: TEntity[] = [], updates: TEntity[] = []) {
        this.additions = [];
        this.removals = [];
        this.removeById = [];

        this.attachments.remove(...removals);

        // move additions to attachments so we can track changes
        this.attachments.push(...add);
    }

    detach(ids: (keyof TEntity)[]) {
        this.attachments.removeById(...ids);
    }

    attach(data: TEntity[]) {

        const result: TEntity[] = [];
        const reselectIds: (keyof TEntity)[] = [];

        for (const item of data) {
            const id = item[this.options.idPropertyName] as keyof TEntity;

            const found = this.attachments.get(id)

            if (found != null) {
                if (this.attachments.includes(id) === true && this.processChanges(found).isDirty === true) {
                    // if the attached item is dirty, it has changed and we issue an error, otherwise return a copy of the referenced item, not the one in the database
                    reselectIds.push(id);
                }

                result.push(found)
                continue;
            }

            result.push(item);
            this.attachments.push(item)
        }

        if (reselectIds.length > 0 && this.options.environment === "development") {
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

    cleanse(entity: TEntity | OmittedEntity<TEntity, TExclusions>) {

        if (this.options.enhancer == null) {
            return entity;
        }

        const cache = memoryCache.get<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this.changeTrackingId);

        if (cache != null) {
            return cache.reverter(entity)
        }

        debugger;
        const enhanced = this.options.enhancer(entity as TEntity);
        const added = Object.keys(enhanced);
        const strip = `const { ${[...added, ...this.options.untrackedPropertyNames].join(', ')}, ...result  } = entity; return result;`;

        const reverter = Function("entity", strip) as (entity: TEntity | OmittedEntity<TEntity, TExclusions>) => TEntity;

        memoryCache.put<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this.changeTrackingId, { reverter })

        return reverter(entity)
    }
}