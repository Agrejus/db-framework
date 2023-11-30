import { IDbSetChangeTracker } from "./change-tracking-types";
import { DbSetPickDefaultActionRequired, EntityComparator, EntitySelector } from "./common-types";
import { ContextOptions, IDataContext } from "./context-types";
import { CustomIdCreator, PropertyMap } from "./dbset-builder-types";
import { IDbRecord, OmittedEntity, IDbRecordBase, EntityIdKeys } from "./entity-types";
import { IDbPlugin } from "./plugin-types";

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
}

export interface IStatefulDbSet<
    TDocumentType extends string,
    TEntity extends IDbRecord<TDocumentType>,
    TExclusions extends keyof TEntity = never,
> extends IDbSet<TDocumentType, TEntity, TExclusions> {
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
    TExclusions extends keyof TEntity = never,
> extends IDbSetEnumerable<TDocumentType, TEntity> {

    get types(): IDbSetTypes<TDocumentType, TEntity, TExclusions>;

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
    adds: EntityAndTag<TEntityBase>[],
    removes: EntityAndTag<TEntityBase>[],
    updates: EntityAndTag<TEntityBase>[],
}

export interface IDbSetApi<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase> {
    dbPlugin: IDbPlugin<TDocumentType, TEntityBase, TExclusions>;
    contextOptions: ContextOptions;
    tag(id: TEntityBase[keyof TEntityBase], value: unknown): void;
    registerOnBeforeSaveChanges: (documentType: TDocumentType, onBeforeSaveChanges: (getChanges: <T extends SaveChangesEventData<TDocumentType, TEntityBase>>() => T) => Promise<void>) => void;
    registerOnAfterSaveChanges: (documentType: TDocumentType, onAfterSaveChanges: (getChanges: <T extends SaveChangesEventData<TDocumentType, TEntityBase>>() => T) => Promise<void>) => void;
}

export interface IDbSetInfo<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    DocumentType: TDocumentType,
    Defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity, TExclusions>,
    Map: PropertyMap<TDocumentType, TEntity, any>[];
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
    map: PropertyMap<TDocumentType, TEntity, TExclusions>[];
    filterSelector: EntitySelector<TDocumentType, TEntity> | null;
    entityComparator: EntityComparator<TDocumentType, TEntity> | null;
}

export type DbSetType = "default" | "stateful";
export type EntityAndTag<T extends IDbRecordBase = IDbRecordBase> = { entity: T, tag?: unknown }

export type DbSetMap = { [key: string]: IDbSet<string, any, any> }

export interface IDbSetState<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase = never> extends IDataContextState<TDocumentType, TEntityBase> {
    add: (...entities: OmittedEntity<TEntityBase, TExclusions>[]) => Promise<TEntityBase[]>
}

export interface IDataContextState<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {
    filter: (selector: EntitySelector<TDocumentType, TEntityBase>) => TEntityBase[],
    find: (selector: EntitySelector<TDocumentType, TEntityBase>) => TEntityBase | undefined,
    all: () => TEntityBase[],
}