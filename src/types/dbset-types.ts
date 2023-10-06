import { ChangeTrackingAdapterBase } from "../adapters/change-tracking/ChangeTrackingAdapterBase";
import { DbSetPickDefaultActionRequired, EntitySelector } from "./common-types";
import { IDataContext } from "./context-types";
import { DbSetKeyType, PropertyMap } from "./dbset-builder-types";
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

export interface IStoreDbSet<
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
    get store(): DbSetStores<TDocumentType, TEntity>;
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
     * Link an existing entitiy or entities to the underlying Data Context, saveChanges must be called to persist these items to the store
     * @param entites Entity or entities to link from the data context
     * @returns {Promise<TEntity[]>}
     */
    link(...entites: TEntity[]): Promise<TEntity[]>;

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

export interface IDbSetApi<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase> {
    dbPlugin: IDbPlugin<TDocumentType, TEntityBase>;
    changeTrackingAdapter: ChangeTrackingAdapterBase<TDocumentType, TEntityBase, TExclusions>;
    tag(id: TEntityBase[keyof TEntityBase], value: unknown): void;
    registerOnBeforeSaveChanges: (documentType: TDocumentType, onBeforeSaveChanges: (getChanges: () => { adds: EntityAndTag[], removes: EntityAndTag[], updates: EntityAndTag[] }) => Promise<void>) => void;
    registerOnAfterSaveChanges: (documentType: TDocumentType, onAfterSaveChanges: (getChanges: () => { adds: EntityAndTag[], removes: EntityAndTag[], updates: EntityAndTag[] }) => Promise<void>) => void;
}

export interface IDbSetInfo<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    DocumentType: TDocumentType,
    IdKeys: EntityIdKeys<TDocumentType, TEntity>,
    Defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity, TExclusions>,
    KeyType: DbSetKeyType;
    Map: PropertyMap<TDocumentType, TEntity, any>[];
    Readonly: boolean;
}

export interface IStoreDbSetProps<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends IDbSetProps<TDocumentType, TEntity, TExclusions> {
    onChange: DbSetOnChangeEvent<TDocumentType, TEntity> | null;
}

export type DbSetChangeType = "hydrate" | "change" | "rehydrate";
export type DbSetOnChangeEvent<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (documentType: TDocumentType, type: DbSetChangeType, changes: { adds: TEntity[], removes: TEntity[], updates: TEntity[], all: TEntity[] }) => void

export interface IDbSetProps<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    documentType: TDocumentType,
    context: IDataContext<TDocumentType, TEntity>,
    defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity, TExclusions>,
    idKeys: EntityIdKeys<TDocumentType, TEntity>;
    readonly: boolean;
    keyType: DbSetKeyType;
    map: PropertyMap<TDocumentType, TEntity, any>[];
    filterSelector: EntitySelector<TDocumentType, TEntity> | null;
}

export type DbSetType = "default" | "store";
export type EntityAndTag<T extends IDbRecordBase = IDbRecordBase> = { entity: T, tag?: unknown }

export type DbSetStores<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> = {
    filter: (selector: EntitySelector<TDocumentType, TEntityBase>) => TEntityBase[],
    find: (selector: EntitySelector<TDocumentType, TEntityBase>) => TEntityBase | undefined,
    all: () => TEntityBase[]
}

export type DbSetMap = { [key: string]: IDbSet<string, any> }