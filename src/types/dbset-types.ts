import { SchemaDefinition } from "../schema/types/Definition";
import { IDbSetChangeTracker } from "./change-tracking-types";
import { DbSetPickDefaultActionRequired, EntityComparator, EntitySelector, GenericSelector, TagsCollection } from "./common-types";
import { ContextOptions, DbFrameworkEnvironment, IDataContext } from "./context-types";
import { CustomIdCreator, Deserializer, EntityEnhancer, Serializer } from "./dbset-builder-types";
import { IDbRecord, OmittedEntity, IDbRecordBase } from "./entity-types";

export type IDbSetTypes<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> = {
    modify: OmittedEntity<TEntity, TExclusions>;
    result: TEntity;
    documentType: TEntity["DocumentType"];
    map: { [DocumentType in TEntity["DocumentType"]]: TEntity; };
    dbsetType: DbSetType;
}


export interface IDbSetEnumerable<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> extends IDbSetBase<TDocumentType> {
    /**
      * Return all items in the underlying data store for the document type
      * @returns {Promise<TEntity[]>}
      */
    all(): Promise<TEntity[]>;

    /**
     * Filter items in the underlying data store and return the results
     * @param selector Callback to filter entities matching the criteria
     * @returns {Promise<TEntity[]>}
     */
    filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>;

    /**
     * Find first item matching the selector in the underlying data store and return the result
     * @param selector Callback to find entity matching the criteria
     * @returns {Promise<TEntity | undefined>}
     */
    find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity | undefined>;

    /**
     * Find first item in the underlying data store and return the result 
     * @returns {Promise<TEntity>}
     */
    first(): Promise<TEntity | undefined>;

    /**
     * Find entity and pluck proptery from the entity
     * @returns {Promise<TEntity>}
     */
    pluck<TKey extends keyof TEntity>(selector: EntitySelector<TDocumentType, TEntity>, propertySelector: TKey): Promise<TEntity[TKey]>
}

export interface IStatefulDbSet<
    TDocumentType extends string,
    TEntity extends IDbRecord<TDocumentType>,
    TExclusions extends keyof TEntity,
    TDbPlugin
> extends IDbSet<TDocumentType, TEntity, TExclusions, TDbPlugin> {
    /**
     * Load existing data into the memory store
     * @returns {Promise<number>}
     */
    hydrate(): Promise<number>;

    /**
     * Local data from the database
     */
    get state(): IDbSetState<TDocumentType, TEntity, TExclusions>;
}

export interface IDbSet<
    TDocumentType extends string,
    TEntity extends IDbRecord<TDocumentType>,
    TExclusions extends keyof TEntity,
    TDbPlugin
> extends IDbSetEnumerable<TDocumentType, TEntity> {

    readonly dbPlugin: TDbPlugin;
    readonly changeTracker: IDbSetChangeTracker<TEntity["DocumentType"], TEntity, TExclusions>;
    get types(): IDbSetTypes<TDocumentType, TEntity, TExclusions>;

    hasSubscriptions(): boolean;

    registerMonitoringMixin(instance: any, ...methodNames: string[]): void;

    serialize(...entities: TEntity[]): any[];

    deserialize(...entities: any[]): TEntity[];

    subscribe(callback: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>): () => void;
    subscribe(selector: EntitySelector<TDocumentType, TEntity>, callback: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>): () => void;

    /**
     * Caches the corresponding data for the next fetch request (find/all/filter/get).  Cache is automatically cleared when any changes are made to the dbset (add, update, remove).  Changes to other dbsets will not clear the cache for this dbset.
     * @param configuration { key: string }
     */
    useCache(): this
    useCache(configuration: DbSetTtlCacheConfiguration): this

    /**
     * Clears the cache only for the DbSet for the given keys.  If no keys are provided, all cache is cleared.
     * @param keys 
     */
    clearCache(...keys: string[]): void;

    /**
     * Add a tag to the transaction (one or more entites from add/remove/upsert) and make available for onAfterSaveChanges or onBeforeSaveChanges.
     * Data is not persisted to the database and is cleared on saveChanges or when context is disposed in memory
     * @param value Any value
     */
    tag(value: unknown): this;

    /**
     * Mark an entity as dirty, will be saved even if there are no changes detected
     * @param entities Entities to mark as dirty
     * @returns {Promise<TEntity[]>}
     */
    markDirty(...entities: TEntity[]): Promise<TEntity[]>

    /**
     * Find entity by an id or ids
     * @param ids ids of the documents to retrieve
     * @returns {Promise<TEntity[]>}
     */
    get(...ids: string[]): Promise<TEntity[]>;

    /**
     * Add one or more entities from the underlying data context, saveChanges must be called to persist these items to the store
     * @param entities Entity or entities to add to the data context
     * @returns {Promise<TEntity[]>}
     */
    add(...entities: OmittedEntity<TEntity, TExclusions>[]): Promise<TEntity[]>;

    /**
     * Add or update one or more entities from the underlying data context, saveChanges must be called to persist these items to the store
     * @param entities Entity or entities to add to the data context
     * @returns {Promise<TEntity[]>}
     */
    upsert(...entities: (OmittedEntity<TEntity, TExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>;

    /**
     * Create one or more entities and do not add it to the underlying data context.  This is useful for creating entities and passing them to other functions.
     * Call {@link add} to add the entity to a context for persistance
     * @param entities Entity or entities to create
     * @returns {TEntity[]}
     */
    instance(...entities: OmittedEntity<TEntity, TExclusions>[]): TEntity[];

    /**
     * Remove one or more entities from the underlying data context, saveChanges must be called to persist these items to the store
     * @param entities Entity or entities to remove from the data context
     * @returns {Promise<void>}
     */
    remove(...entities: TEntity[]): Promise<void>;

    /**
     * Remove one or more entities by id from the underlying data context, saveChanges must be called to persist these items to the store
     * @param ids Entity id or ids to remove from the data context
     * @returns {Promise<void>}
     */
    remove(...ids: string[]): Promise<void>;

    /**
     * Check for equality between two entities
     * @param first First entity to compare
     * @param second Second entity to compare
     * @returns {boolean}
     */
    isMatch(first: TEntity, second: any): boolean;

    /**
     * Unlinks an entity or entities from the context so they can be modified and changes will not be persisted to the underlying data store
     * @param entities Entity or entities to unlink from the data context
     * @returns {void}
     */
    unlink(...entities: TEntity[]): void;

    /**
     * Unlinks an entity or entities from the context so they can be modified and changes will not be persisted to the underlying data store
     * @param ids Entity ids
     * @returns {void}
     */
    unlink(...ids: (keyof TEntity)[]): void

    /**
     * Link an existing entitiy or entities to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entites Entity or entities to link from the data context
     * @returns {Promise<TEntity[]>}
     */
    link(...entites: TEntity[]): Promise<TEntity[]>;

    /**
     * Link an existing entitiy or entities to the underlying Data Context in an unsafe manner.  Does not check existing entities, will dangerously attach the exact entity
     * @param entites Entity or entities to link from the data context
     * @returns {TEntity[]}
     */
    linkUnsafe(...entites: TEntity[]): TEntity[];

    /**
     * Checks to see if an entity is linked to a dbset.  If the entity is linked, any updates are automatically tracked and saved.  If it is not
     * linked, any changes to an entity will not be saved.
     * @param entity 
     */
    isLinked(entity: TEntity): boolean;

    /**
     * Matches items with the same document type.  Useful for retrieving all docs and calling match() to find the ones that belong in the db set
     * @param entities Entity or entities to match on document type.
     * @returns {TEntity[]}
     */
    match(...entities: IDbRecordBase[]): TEntity[];

    /**
     * Get DbSet info
     * @returns {IDbSetInfo<TDocumentType, TEntity>}
     */
    info(): IDbSetInfo<TDocumentType, TEntity, TExclusions>
}

export interface IDbSetBase<TDocumentType extends string> {

    /**
     * Remove all entities from the underlying data context, saveChanges must be called to persist these changes to the store
     */
    empty(): Promise<void>;
}

export type SaveChangesEventData<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> = {
    adds: EntityAndTag<TEntityBase>[];
    removes: EntityAndTag<TEntityBase>[];
    updates: EntityAndTag<TEntityBase>[];
}

export interface IDbSetApi<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TDbPlugin> {
    dbPlugin: TDbPlugin;
    contextOptions: ContextOptions;
    readonly contextId: string;
    tag(id: TEntityBase[keyof TEntityBase], value: unknown): void;
    registerOnBeforeSaveChanges: (documentType: TDocumentType, onBeforeSaveChanges: (getChanges: <T extends SaveChangesEventData<TDocumentType, TEntityBase>>() => T) => Promise<void>) => void;
    registerOnAfterSaveChanges: (documentType: TDocumentType, onAfterSaveChanges: (getChanges: <T extends SaveChangesEventData<TDocumentType, TEntityBase>>() => T) => Promise<void>) => void;
}

export interface IDbSetInfo<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    DocumentType: TDocumentType,
    Defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity, TExclusions>,
    Readonly: boolean;
    ChangeTracker: IDbSetChangeTracker<TDocumentType, TEntity, TExclusions>
}

export interface IStoreDbSetProps<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends IDbSetProps<TDocumentType, TEntity, TExclusions> {
    onChange: DbSetOnChangeEvent<TDocumentType, TEntity> | null;
}

export type DbSetChangeType = "hydrate" | "change" | "rehydrate";
export type DbSetRemoteChanges<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = DbSetChanges<TDocumentType, TEntity> & { remotes: TEntity[] }
export type DbSetChanges<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = { adds: TEntity[], removes: TEntity[], updates: TEntity[], all: TEntity[] }
export type DbSetOnChangeEvent<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (documentType: TDocumentType, type: DbSetChangeType, changes: DbSetChanges<TDocumentType, TEntity>) => void;
export type DbSetRemoteOnChangeEvent<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (documentType: TDocumentType, type: DbSetChangeType, changes: DbSetRemoteChanges<TDocumentType, TEntity>) => void

export interface IDbSetProps<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    documentType: TDocumentType,
    context: IDataContext<TDocumentType, TEntity>,
    defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity, TExclusions>,
    readonly: boolean;
    idCreator: CustomIdCreator<TDocumentType, TEntity>;
    filterSelector: EntitySelector<TDocumentType, TEntity> | null;
    entityComparator: EntityComparator<TDocumentType, TEntity> | null;
    serializer: Serializer<TDocumentType, TEntity> | null;
    deserializer: Deserializer<TDocumentType, TEntity> | null;
    enhancer?: EntityEnhancer<TDocumentType, TEntity>;
    schema?: SchemaDefinition<TDocumentType, any>;
}

export type DbSetType = "default" | "stateful";
export type EntityAndTag<T extends IDbRecordBase = IDbRecordBase> = { entity: T, tag?: unknown }

export type DbSetMap = { [key: string]: IDbSet<string, any, any, any> }

export interface IDbSetState<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase = never> extends IDataContextState<TDocumentType, TEntityBase> {
    add: (...entities: OmittedEntity<TEntityBase, TExclusions>[]) => Promise<TEntityBase[]>
}

export interface IDataContextState<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {
    filter: (selector: EntitySelector<TDocumentType, TEntityBase>) => TEntityBase[],
    find: (selector: EntitySelector<TDocumentType, TEntityBase>) => TEntityBase | undefined,
    all: () => TEntityBase[],
}

export type ChangeTrackingOptions<
    TDocumentType extends string,
    TEntity extends IDbRecord<TDocumentType>
> = {
    untrackedPropertyNames: Set<string>,
    contextName: string,
    environment?: DbFrameworkEnvironment
}

export type DbSetTtlCacheConfiguration = {
    key: string;
    ttl: number
}

export type DbSetSubscriptionCallback<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> = (adds: EntityAndTag<TEntity>[], updates: EntityAndTag<TEntity>[], removes: EntityAndTag<TEntity>[]) => void

export type DbSetSubscription<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity = never> = {
    callback: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>;
    selector?: GenericSelector<EntityAndTag<TEntity>>;
    id: string;
}