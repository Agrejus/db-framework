import { Enrichment, IAttachmentDictionary, ProcessedChangesResult } from "../../types/change-tracking-types";
import { ITrackedChanges, ITrackedData } from "../../types/context-types";
import { ChangeTrackingOptions, IDbSetProps } from "../../types/dbset-types";
import { IDbRecord, IdRemoval } from "../../types/entity-types";
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

    protected readonly changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>;
    protected readonly dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>;
    protected readonly changeTrackingId: string;

    constructor(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: ChangeTrackingOptions<TDocumentType, TEntity>) {
        this.changeTrackingOptions = changeTrackingOptions;
        this.dbSetProps = dbSetProps;

        this.changeTrackingId = `${this.changeTrackingOptions.contextName}-${this.dbSetProps.documentType}`

        // compose enrichers
        this.enrichment = this._composeEnrichers();
    }

    private _composeEnrichers() {
        const enrichment: Enrichment<TDocumentType, TEntity, TExclusions> = {
            add: () => void (0),
            retrieve: () => void (0),
            enhance: () => void (0),
            map: () => void (0),
            upsert: () => void (0)
        }

        const cache = memoryCache.get<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this.changeTrackingId);

        if (cache?.enrichment != null) {
            return cache.enrichment
        }

        // document type enricher
        const documentTypeEnricher = ((entity: TEntity) => {
            (entity as any).DocumentType = this.dbSetProps.documentType;
            return entity;
        }).bind(this)

        // id enricher
        const idEnricher = ((entity: TEntity) => {

            (entity as any)[this.changeTrackingOptions.idPropertyName] = this.dbSetProps.idCreator(entity)

            return entity;
        }).bind(this)

        // default enrich first
        const defaultAddEnricher = ((entity: TEntity) => {

            // make this faster!
            const keys = Object.keys(this.dbSetProps.defaults.add);

            for (const key of keys) {
                (entity as any)[key] = (this.dbSetProps.defaults.add as any)[key];
            }

            return entity;
        }).bind(this)

        const defaultRetrieveEnricher = ((entity: TEntity) => {
            const keys = Object.keys(this.dbSetProps.defaults.retrieve);

            for (const key of keys) {
                (entity as any)[key] = (this.dbSetProps.defaults.retrieve as any)[key];
            }

            return entity;
        }).bind(this)

        const mapEnrichers: ((entity: TEntity) => TEntity)[] = [];
        const enhancementEnrichers: ((entity: TEntity) => TEntity)[] = [];

        // add mappings
        if (this.dbSetProps.map.length > 0) {
            const propertyMapEnrichers = this.dbSetProps.map.map(w => (entity: TEntity) => {
                const preTransformedValue = (entity)[w.property as keyof TEntity];
                const value: any = Object.prototype.toString.call(preTransformedValue) === '[object Date]' ? preTransformedValue : w.map(preTransformedValue as any, entity);

                (entity as any)[w.property] = value;

                return entity;
            });

            mapEnrichers.push(...propertyMapEnrichers)
        }

        // add enhancers last
        if (this.dbSetProps.enhancer != null) {
            enhancementEnrichers.push((w: TEntity) => {

                const enhanced = this.dbSetProps.enhancer(w);
                const keys = Object.keys(enhanced);

                for (const key of keys) {
                    (w as any)[key] = (enhanced as any)[key];
                    if (this.changeTrackingOptions.untrackedPropertyNames.has(key) === false) {
                        this.changeTrackingOptions.untrackedPropertyNames.add(key)
                    }
                }

                return w;
            })
        }

        const add = [documentTypeEnricher, idEnricher, defaultAddEnricher, ...mapEnrichers, ...enhancementEnrichers];
        const upsert = [defaultAddEnricher, ...mapEnrichers, ...enhancementEnrichers];
        const retrieve = [defaultRetrieveEnricher, ...mapEnrichers, ...enhancementEnrichers];

        enrichment.add = (entity) => add.reduce((a, v) => v(a), entity);
        enrichment.retrieve = (entity) => retrieve.reduce((a, v) => v(a), entity);
        enrichment.map = (entity) => mapEnrichers.reduce((a, v) => v(a), entity);
        enrichment.enhance = (entity) => enhancementEnrichers.reduce((a, v) => v(a), entity);
        enrichment.upsert = (entity) => upsert.reduce((a, v) => v(a), entity);

        memoryCache.put<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this.changeTrackingId, { enrichment });

        return enrichment;
    }

    isAttached(id: keyof TEntity) {
        return this.attachments.has(id);
    }

    isLinked(entity: TEntity) {
        return this.attachments.get(entity[this.changeTrackingOptions.idPropertyName] as keyof TEntity) === entity;
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
            const id = item[this.changeTrackingOptions.idPropertyName] as keyof TEntity;

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

        if (reselectIds.length > 0 && this.changeTrackingOptions.environment === "development") {
            console.warn(`Reselect Warning.  Data has been reselected and changed between operations.  Entities should not be changed and then reselected, Db Framework functions return a copy of the entity that should be used in all operations.  Reselecting an item can lead to unwanted and missed changes. - Ids: ${reselectIds.join(', ')}`);
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

    cleanse(...entities: TEntity[]) {

        if (entities.length === 0) {
            return;
        }

        const cache = memoryCache.get<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this.changeTrackingId);

        if (cache != null && cache.reverter != null) {
            for (const item of entities) {
                cache.reverter(item)
            }
            return;
        }

        const untrackedProperties = [...this.changeTrackingOptions.untrackedPropertyNames];

        if (this.dbSetProps.enhancer != null) {
            const entity = entities[0]
            const enhanced = this.dbSetProps.enhancer(entity as TEntity);
            const added = Object.keys(enhanced);
            untrackedProperties.push(...added);
        }

        const strip = `${untrackedProperties.map(w => `delete entity.${w}`).join(';\r\n')} \r\nreturn entity;`;

        const reverter = Function("entity", strip) as (entity: TEntity) => TEntity;

        memoryCache.put<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(this.changeTrackingId, { reverter })

        for (const item of entities) {
            reverter(item)
        }
    }
}   