import { DeepPartial, DbSetPickDefaultActionRequired, EntitySelector } from "./common-types";
import { ITrackedData, IDataContext } from "./context-types";
import { DbSetKeyType, PropertyMap } from "./dbset-builder-types";
import { IDbRecord, OmittedEntity, IDbRecordBase, EntityIdKeys } from "./entity-types";
import { IDbPlugin } from "./plugin-types";

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
    TExtraExclusions extends string = never,
> extends IDbSet<TDocumentType, TEntity, TExtraExclusions> {
    hydrate(): Promise<number>;
    get store(): TEntity[];
}

export interface IDbSet<
    TDocumentType extends string,
    TEntity extends IDbRecord<TDocumentType>,
    TExtraExclusions extends string = never,
> extends IDbSetEnumerable<TDocumentType, TEntity> {

    get types(): {
        modify: OmittedEntity<TEntity, TExtraExclusions>,
        result: TEntity,
        documentType: TEntity["DocumentType"],
        map: { [DocumentType in TEntity["DocumentType"]]: TEntity },
        dbsetType: DbSetType;
    };

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
    add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): Promise<TEntity[]>;

    /**
     * Add or update one or more entities from the underlying data context, saveChanges must be called to persist these items to the store
     * @param entities Entity or entities to add to the data context
     * @returns {Promise<TEntity[]>}
     */
    upsert(...entities: (OmittedEntity<TEntity, TExtraExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>;

    /**
     * Create one or more entities and do not add it to the underlying data context.  This is useful for creating entities and passing them to other functions.
     * Call {@link add} to add the entity to a context for persistance
     * @param entities Entity or entities to create
     * @returns {TEntity[]}
     */
    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): TEntity[];

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
    info(): IDbSetInfo<TDocumentType, TEntity>
}

export interface IDbSetBase<TDocumentType extends string> {

    /**
     * Remove all entities from the underlying data context, saveChanges must be called to persist these changes to the store
     */
    empty(): Promise<void>;
}

export interface IDbSetApi<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>> {
    plugin: IDbPlugin<TDocumentType, TEntityBase>;
    getTrackedData: () => ITrackedData<TDocumentType, TEntityBase>;
    send: (data: TEntityBase[]) => void;
    detach: (data: TEntityBase[]) => TEntityBase[];
    makeTrackable<T extends Object>(entity: T, defaults: DeepPartial<OmittedEntity<T>>, readonly: boolean, maps: PropertyMap<any, any, any>[]): T;
    makePristine(...entities: TEntityBase[]): void;
    map<T extends Object>(entity: T, maps: PropertyMap<any, any, any>[], defaults?: DeepPartial<OmittedEntity<T, never>>): T
    tag(id: string, value: unknown): void;
    readonly DIRTY_ENTITY_MARKER: string;
    readonly PRISTINE_ENTITY_KEY: string;
    registerOnBeforeSaveChanges: (documentType: TDocumentType, onBeforeSaveChanges: (getChanges: () => { adds: EntityAndTag[], removes: EntityAndTag[], updates: EntityAndTag[] }) => Promise<void>) => void;
    registerOnAfterSaveChanges: (documentType: TDocumentType, onAfterSaveChanges: (getChanges: () => { adds: EntityAndTag[], removes: EntityAndTag[], updates: EntityAndTag[] }) => Promise<void>) => void;
}

export interface IDbSetInfo<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    DocumentType: TDocumentType,
    IdKeys: EntityIdKeys<TDocumentType, TEntity>,
    Defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>,
    KeyType: DbSetKeyType;
    Map: PropertyMap<TDocumentType, TEntity, any>[];
    Readonly: boolean;
}

export interface IStoreDbSetProps<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> extends IDbSetProps<TDocumentType, TEntity> {
    onChange: DbSetOnChangeEvent<TDocumentType, TEntity> | null;
}

export type DbSetChangeType = "hydrate" | "change"
export type DbSetOnChangeEvent<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (documentType: TDocumentType, type: DbSetChangeType, changes: { adds: TEntity[], removes: TEntity[], updates: TEntity[], all: TEntity[] }) => void

export interface IDbSetProps<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> {
    documentType: TDocumentType,
    context: IDataContext<TDocumentType, TEntity>,
    defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity>,
    idKeys: EntityIdKeys<TDocumentType, TEntity>;
    readonly: boolean;
    keyType: DbSetKeyType;
    map: PropertyMap<TDocumentType, TEntity, any>[];
    filterSelector: EntitySelector<TDocumentType, TEntity> | null;
}

export type DbSetType = "default" | "store";

export type DbSetEventCallback<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entity: TEntity) => void;
export type DbSetIdOnlyEventCallback = (entity: string) => void;

export type DbSetEventCallbackAsync<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> = (entities: TEntity[]) => Promise<void>;
export type DbSetIdOnlyEventCallbackAsync = (entities: string[]) => Promise<void>;

export type IncludeType = "all" | string[];
export type EntityAndTag<T extends IDbRecordBase = IDbRecordBase> = { entity: T, tag?: unknown }