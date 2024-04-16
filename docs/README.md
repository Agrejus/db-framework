<!-- <p align="center">
  <a href="" rel="noopener">
 <img width=200px height=200px src="https://i.imgur.com/6wj0hh6.jpg" alt="Project logo"></a>
</p> -->

<h3 align="center"><img src="./assets/DB%20Framework.png" alt="Project logo"></a></h3>
<div align="center">

  [![Downloads](https://img.shields.io/npm/dm/%40agrejus%2Fdb-framework.svg)]() 
  [![Status](https://img.shields.io/badge/status-active-success.svg)]() 
  [![GitHub Issues](https://img.shields.io/github/issues/agrejus/db-framework.svg)](https://github.com/agrejus/db-framework/issues)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)
  [![Discord](https://img.shields.io/discord/1225536931736195072?color=blue&label=Discord&logo=discord&logoColor=white)](https://discord.gg/yfwtfcqE55)

</div>

---

<p align="center"> Create a versatile Data Interaction Layer for Node.js and/or the web that seamlessly handles database or HTTP interactions. Effortlessly abstract database interactions using DB Framework, simplifying the process of switching databases or incorporating two different databases.  Furthermore, empower entities with the ability to encompass functions or non-persistent data, enabling developers to seamlessly integrate business logic into entities.
    <br> 
</p>

## Table of Contents
- [About](#about)
- [Help](https://discord.gg/yfwtfcqE55)
- [Getting Started](#getting_started)
  - [Installation](#installation)
  - [Basic Usage](#basic_usage_example)
- [Modifying Data](#modifying_data)
    - [Create](#create_data)
    - [Update](#update_data)
    - [Delete](#delete_data)
- [Query Data](#query_data)
    - [All](#query_data_all)
    - [Filter](#query_data_filter)
    - [Find](#query_data_find)
    - [First](#query_data_first)
    - [Pluck](#query_data_pluck)
    - [Get All Documents](#query_data_get_all_docs)
- [Change Tracking](#change_tracking)
    - [Default Change Tracking](#default_change_tracking)
    - [Custom Change Tracking](#custom_change_tracking)
    - [Readonly Change Tracking](#readonly_change_tracking)
- [Database Plugins](#database_plugins)
    - [Memory Database Plugin](#database_plugins_memory)
    - [PouchDB Database Plugin](#database_plugins_pouchdb)
    - [Local Storage Database Plugin](#database_plugins_local_storage)
    - [CapacitorJS Realm Database Plugin](#capacitorjs-realm-plugin)
    - [Custom Database Plugin](#database_plugins_custom)
- [Data Context](#data_context)
    - [Methods](#data_context_methods)
        - [saveChanges()](#data_context_save_changes)
        - [getAllDocs()](#data_context_get_all_docs)
        - [hasPendingChanges()](#data_context_has_pending_changes)
        - [previewChanges()](#data_context_preview_changes)
        - [empty()](#data_context_empty)
        - [destroyDatabase()](#data_context_destroy_database)
        - [getDbSet()](#data_context_get_db_set)
        - [onBeforeSaveChanges()](#data_context_on_before_save_changes)
        - [onAfterSaveChanges()](#data_context_on_after_save_changes)
        - [onSaveError()](#data_context_on_save_error)
        - [clearCache()](#data_context_on_clear_cache)
    - [Middleware](#data_context_middleware)
        - [History Tracking](#data_context_middleware_history_tracking)
        - [Making Your Own Middleware](#data_context_making_your_own_middleware)
    - [Builder API](#data_context_builder_api)
- [Stateful Data Context](#stateful_data_context)
    - [Methods](#stateful_data_context_methods)
        - [addChangeEventListener()](#add_change_event_listener)
        - [removeAllEventListeners()](#remove_all_event_listeners)
        - [hydrate()](#stateful_data_context_hydrate)
- [Model Declaration](#model_declaration)
- [Performance and Profiling](#performance_and_profiling)
- [Concepts](#concepts)
    - [State Management](#state_management)
    - [Logging](#logging)
    - [Entity Tagging](#entity_tagging)
    - [History Tracking](#history_tracking)
- [Default DbSet](#default_dbset)
    - [Builder API](#default_dbset_builder_api)
        - [keys()](#default_dbset_builder_api_keys)
        - [defaults()](#default_dbset_builder_api_defaults)
        - [exclude()](#default_dbset_builder_api_exclude)
        - [readonly()](#default_dbset_builder_api_readonly)
        - [serialize()](#default_dbset_builder_api_serialize)
        - [deserialize()](#default_dbset_builder_api_deserialize)
        - [filter()](#default_dbset_builder_api_filter)
        - [getChanges()](#default_dbset_builder_api_get_changes)
        - [enhance()](#default_dbset_builder_api_enhance)
        - [create()](#default_dbset_builder_api_create)
    - [Methods](#default_dbset_methods)
        - [info()](#default_dbset_methods_info)
        - [useCache()](#default_dbset_methods_use_cache)
        - [clearCache()](#default_dbset_methods_clear_cache)
        - [tag()](#default_dbset_methods_tag)
        - [instance()](#default_dbset_methods_instance)
        - [add()](#default_dbset_methods_add)
        - [upsert()](#default_dbset_methods_upsert)
        - [remove()](#default_dbset_methods_remove)
        - [empty()](#default_dbset_methods_empty)
        - [all()](#default_dbset_methods_all)
        - [filter()](#default_dbset_methods_filter)
        - [isMatch()](#default_dbset_methods_is_match)
        - [match()](#default_dbset_methods_match)
        - [get()](#default_dbset_methods_get)
        - [find()](#default_dbset_methods_find)
        - [unlink()](#default_dbset_methods_unlink)
        - [markDirty()](#default_dbset_methods_mark_dirty)
        - [link()](#default_dbset_methods_link)
        - [linkUnsafe()](#default_dbset_methods_link_unsafe)
        - [isLinked()](#default_dbset_methods_is_linked)
        - [first()](#default_dbset_methods_first)
        - [pluck()](#default_dbset_methods_pluck)
        - [serialize()](#default_dbset_methods_serialize)
        - [deserialize()](#default_dbset_methods_deserialize)
    - [Fields](#default_dbset_fields)
        - [types](#default_dbset_fields_types)
- [Stateful DbSet](#stateful_dbset)
    - [Builder API](#stateful_dbset_builder_api)
        - [onChange()](#stateful_dbset_builder_api_on_change)
    - [Methods](#stateful_dbset_builder_api_methods)
        - [hydrate()](#stateful_dbset_builder_api_methods_hydrate)
    - [Fields](#stateful_dbset_builder_api_fields)
        - [state](#stateful_dbset_builder_api_fields_state)
- [Change Log](./changelog.md)
- [Authors](#authors)
- [Examples](https://github.com/agrejus/db-framework/tree/main/examples)

## About <a name = "about"></a>
Db Framework is a TypeScript first ORM designed to wrap existing database frameworks such as PouchDB to augment its functionality.  Db Framework aims to take the headaches out of other ORMs and provide repeatable processes for CRUD operations with minimal code.  Inspired by .NET's Entity Framework, Db Framework operates the same way and tries to keep method names as close as possible.

Db Framework provides a ton of flexibility, even going as far as offering a local state store (think Redux).

Why it's great:
- Works with many different databases or even HTTP APIs
- Can easily add/augment current functionality
- Can create plugins to use with any database
- Fast, uses bulk operations for all data manipulation
- Works in NodeJS and all modern browsers

Everything in Db Framework is done in functional transactions, meaning, developers should always use the result of the function that was executed, not a previous result from a different function.  All functions return a new instance of an entity to be acted upon or changed and then saved.

## Getting Started <a name = "getting_started"></a>
Getting started with Db Framework is very easy and fast.  Create your models, document types, declare your DbSet and profit!  To get started, first install DB Framework

<a name = "installation"></a>
```
npm install @agrejus/db-framework
```

Install a db provider (or make your own!)
- PouchDB - `npm i @agrejus/db-framework-plugin-pouchdb`
- Memory - `npm i @agrejus/db-framework-plugin-memory`
- Local Storage - `npm i @agrejus/db-framework-plugin-localstorage`

See a [working example below](#basic_usage_example)

### Basic Usage Example <a name="basic_usage_example"></a>
Example using PouchDB
```typescript
import { DataContext } from '@agrejus/db-framework';
import { PouchDbPlugin, PouchDbRecord } from '@agrejus/db-framework-plugin-pouchdb';

// Declare document types
export enum MyDocumentTypes {
    Vehicle = "Vehicle",
    VehicleHistory = "VehicleHistory",
    Book = "Book"
}

// Declare models
export interface IVehicle extends PouchDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

export interface IBook extends PouchDbRecord<MyDocumentTypes.Book> {
    author: string;
    publishedDate: string | null;
    year: number;
    status: "pending_publisher" | "approved";
}


// Create Data context using a provider
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
    books = this.dbset().default<IBook>(MyDocumentTypes.Book).create();
}

// Adding Data
const context = new MyDataContext();

await context.vehicles.add({
    color: "Silver",
    make: "Chevrolet",
    model: "Silverado",
    trim: "RST",
    year: 2021
});

await context.saveChanges();
```










## Modifying Data <a name = "modifying_data"></a>
DB Framework makes it very easy to modify data.  Simply use the appropiate DbSet to create/update/delete a record.  Updating data can change depending on the change tracking being used.  [Default Change Tracking](#default_change_tracking), [Custom Change Tracking](#custom_change_tracking), or [Readonly Change Tracking](#readonly_change_tracking) can be used to track changes on an entity.  By default Entity Change Tracking is used, but if serialization becomes an issue, please use Context Change Tracking or do your own manual serialization.

### Create <a name = "create_data"></a>
Much like the getting started example, the below example demonstrates how to insert a record in the underlying datastore. Please see [.add()](#dbset_add) for more examples

```typescript
// Adding Data
const context = new MyDataContext();

await context.vehicles.add({
    color: "Silver",
    make: "Chevrolet",
    model: "Silverado",
    trim: "RST",
    year: 2021
});

await context.saveChanges();

// Once Save Changes is called, all changes are persisted into the database
```

### Update <a name = "update_data"></a>
The below example demonstrates how to find and update a record in the underlying datastore. Please see the DbSet query methods for more examples.

```typescript
const context = new MyDataContext();

const found = await context.vehicles.find(w => w.year === 2021);

if (found != null) {
    found.trim = "some different trim"
}

await context.saveChanges();
```

### Delete <a name = "delete_data"></a>
The below example demonstrates how to find and update a record in the underlying datastore. Please see the DbSet query methods for more examples.

```typescript
const context = new MyDataContext();

const found = await context.vehicles.find(w => w.year === 2021);

if (found != null) {
    await context.vehicles.remove(found)
}

await context.saveChanges();

```










## Query Data <a name = "query_data"></a>
Db Framework makes it very easy to query data in each underlying DbSet.  Please see DbSet for more examples of querying data

```typescript
const context = new MyDataContext();

const chevy2021Vehicles = await context.vehicles.filter(w => w.year === 2021 && w.make === "Chevrolet");

```

### `.all(): Promise<TEntity[]>` <a name = "query_data_all"></a>
DbSet method to return all data.  Data only pertains to the calling DbSet.
### `.filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>` <a name = "query_data_filter"></a>
DbSet method to return all data matching the selector function.  Data only pertains to the calling DbSet.
### `.find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity | undefined>` <a name = "query_data_find"></a>
DbSet method to return the first entity matching the selector function.  Data only pertains to the calling DbSet.
### `.first(): Promise<TEntity | undefined>` <a name = "query_data_first"></a>
DbSet method to return the first entity.  Data only pertains to the calling DbSet.
### `.pluck<TKey extends keyof TEntity>(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean, propertySelector: TKey): Promise<TEntity[TKey]>` <a name = "query_data_pluck"></a>
DbSet method to find an entity and return (pluck) a property from the found entity.
### `.getAllDocs(): Promise<TEntity[]>` <a name = "query_data_get_all_docs"></a>
Data Context method to return all data in the database.

## Change Tracking <a name = "change_tracking"></a>
Db Framework offers two different types of change tracking: Entity and Context.  Change tracking is an important part of Db Framework as it allows the framework to detect changes and only save data that has changed vs over saving.  Another advantage of change tracking is the ability to split out add/update/delete actions for use in underlying data stores.


### Default Change Tracking <a name = "default_change_tracking"></a>
Uses [Proxy object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to detect changes in the entity to determine if it has changed.  This form of change tracking is great, because changes are tracked at the entity level, independent of the context.  
- Pros:
    - Entities can be passed between contexts and changes are retained
- Cons:
    - Proxy objects can be a pain to deal with, especially serializing then across boundaries (WebWorkers)


### Custom Change Tracking <a name = "custom_change_tracking"></a>
Uses a custom [user defined comparator](#default_dbset_builder_get_changes) function to track changes in entities.  Changes are stored at the context level, not the entity.  If an entity is passed from one context to another via [linking](#dbset_link), changes are lost and the object needs to be [marked dirty](#dbset_mark_dirty) to recognize changes have been made.  This form of change tracking is great because all objects are plain old JavaScript objects that can be easily serialized.
- Pros:
    - Entities are plain JavaScript objects
- Cons:
    - Changes are lost when entites are linked between contexts
    - Saving/Selecting large amounts of data is slightly slower that default change tracking

### Readonly Change Tracking <a name = "readonly_change_tracking"></a>
No change tracking is used since the entities are readonly.  Entites are also [frozen](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) and do not allow updates.  Using readonly change tracking, entities can only be added and removed, never updated.









## Database Plugins <a name = "database_plugins"></a>
DB Framework can work with a variety of different data stores through the use of database plugins.  The database plugin is the way DB Framework interacts with the database.  These plugins can be swapped out for different ones, or custom ones can be created.  For ease of use, there are 3 existing plugins that can be used below.

### Memory Plugin <a name = "data_context_save_changes"></a>
Saves all underlying changes to memory.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.

**Package:** [@agrejus/db-framework-plugin-memory](https://github.com/agrejus/db-framework/tree/main/plugins/memory)

### PouchDB Plugin <a name = "data_context_save_changes"></a>
Saves all underlying changes to the adapter defined in the PouchDB plugin.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.

**Package:** [@agrejus/db-framework-plugin-pouchdb](https://github.com/agrejus/db-framework/tree/main/plugins/pouchdb)

### Local Storage Plugin <a name = "data_context_save_changes"></a>
Saves all underlying changes to local storage.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.

**Package:** [@agrejus/db-framework-plugin-local-storage](https://github.com/agrejus/db-framework/tree/main/plugins/localstorage)

### CapacitorJS Realm Plugin <a name = "capacitorjs-realm-plugin"></a>
Saves all underlying changes to local Realm.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.

**Package:** [@agrejus/db-framework-plugin-capacitor-realm](https://github.com/agrejus/db-framework/tree/main/plugins/capacitor-realm)

### CapacitorJS Sqlite Plugin <a name = "capacitorjs-sqlite-plugin"></a>
Saves all underlying changes to Sqlite.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.

**Package:** [@agrejus/db-framework-plugin-capacitor-sqlite3](https://github.com/agrejus/db-framework/tree/main/plugins/capacitor-sqlite3)

### Custom Database Plugin <a name = "database_plugins_custom"></a>
With DB Framework, developers can create their own custom plugins by implementing `IDbPlugin`.  Below is the interface with explanations on how to implement each method of the interface.

**Implementation**
```typescript
// interface exported by DB Framework
interface IDbPlugin<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase = never> {
    readonly idPropertName: keyof TEntityBase;
    readonly types: { exclusions: TExclusions }
    destroy(): Promise<void>;
    all(payload?: IQueryParams<TDocumentType>): Promise<TEntityBase[]>;
    getStrict(...ids: string[]): Promise<TEntityBase[]>;
    get(...ids: string[]): Promise<TEntityBase[]>;
    bulkOperations(operations: { adds: TEntityBase[], removes: TEntityBase[], updates: TEntityBase[] }): Promise<IBulkOperationsResponse>;

    prepareDetachments(...entities: TEntityBase[]): { ok: boolean, errors: string[], docs: TEntityBase[] }
    prepareAttachments(...entities: TEntityBase[]): Promise<{ ok: boolean, errors: string[], docs: TEntityBase[] }>;
    isOperationAllowed(entity: TEntityBase, operation: DbPluginOperations): boolean;
    formatDeletions(...entities: TEntityBase[]): TEntityBase[];
    setDbGeneratedValues(response: IBulkOperationsResponse, entities: TEntityBase[]): void;
}

// Custom Plugin types 
type MyDbRecord<TDocumentType extends string> = {
    readonly _id: string;
} & IDbRecord<TDocumentType>

// Custom Plugin Implementation
class CustomDbPlugin<TDocumentType extends string, TEntityBase extends MyDbRecord<TDocumentType>, TDbPluginOptions extends IDbPluginOptions = IDbPluginOptions> implements IDbPlugin<TDocumentType, TEntityBase, "_id"> {

    protected readonly options: TDbPluginOptions;

    // Property that is used to identity whether or not an entity was saved to the database.  If this property is set, then we know an entity was saved to the database.
    readonly identifier = "_rev";

    // Universal Id Property Name, must be the same for all entities
    readonly idPropertName = "_id";

    readonly types = {
        exclusions: "" as "_id" // Any properties to be excluded when making additions into the database.  These exclusions are used when .add() is called on a Db Set
    }

    constructor(options: TDbPluginOptions) {
        this.options = options;
    }

    async destroy(): Promise<void> {
        // this function destroys the underlying database

        // Example:  For PouchDB, we destroy the database
    }

    validateEntity(entity: TEntityBase): IValidationResult<TDocumentType, TEntityBase>[] {
        // Runs validation on an entity to ensure it can be linked or unlinked from the dbset.  Entities that are linked or unlinked must already exist in the database, otherwise we need to use a different function such as upsert.

        // Example:  For PouchDB, we can check if the entity has an _id and _rev property set
    }

    async all(payload?: IQueryParams<TDocumentType>): Promise<TEntityBase[]> {
       // Queries the database using the given playload and returns list of documents matching payload 

       // Example:  For PouchDB, we perform a find operation based on the payload.
    }

    async getStrict(...ids: string[]): Promise<TEntityBase[]> {
        // Get entities by a list of ids, should throw error if entities are not found for given id(s)
    
        // Example:  For PouchDB, we get an list of entites by Id, but will throw if an entity is not found for an Id
    }

    async get(...ids: string[]): Promise<TEntityBase[]> {
       // Get entities by a list of ids, should NOT throw error if entities are not found for given id(s)

       // Example:  For PouchDB, we get an list of entites by Id
    }

    async bulkOperations(operations: { adds: TEntityBase[]; removes: TEntityBase[]; updates: TEntityBase[]; }, transactions: Transactions): Promise<IBulkOperationsResponse> {
        // Performs bulk operation, meaning, all adds/removes/updates are done in one operation.  For other databases that do not have this functionality, adds/removes/updates can be done separately.

        // Example:  For PouchDB, adds/removes/updates can all be done in one operation, so we group all items together and perform the operation
    }

    async prepareAttachments(...entities: TEntityBase[]): Promise<{ ok: boolean, errors: string[], docs: TEntityBase[] }> {
        // Prepares entities to be attached to the Db Set.  Used when .link() is called on a Db Set.  This method is responsible for finding the existing entity and merging it with the entity passed into this function.  Should set any properties and return the result of the merge

        // Example:  For PouchDB, we try and find existing documents by _id, then we use only the _rev property from the found document, and set it on the entity from the parameters.  This function also verifies that the _rev, DocumentType, and _id properties are set.  We look up the entity, because we want to ensure the entity being passed in has the latest _rev so it is saved properly
    }

    enrichRemoval(entity: TEntityBase): TEntityBase {
        // Some databases only do soft deletes and work by setting an flag like _deleted to deleted items.  If this is not the case, we can just return the passed in entites.  Otherise format entites as needed so they can be deleted properly.

        // Example:  For PouchDB, this function maps entites to remove all properties but _id, _rev, and adds the _deleted flag
    }

    isOperationAllowed(entity: TEntityBase, operation: DbPluginOperations): { ok: boolean, error?: string } {
        // Given an entity and operation, we can determine if we are allowed to do an operation.  This function is used when .add() is called on a Db Set.  

        // Example: For PouchDB, this function is used to check whether or not an entity has a _rev property set, if it does, that means it is not an add because that property is set only after saving an entity.
    }

    prepareDetachments(...entities: TEntityBase[]): { ok: boolean; errors: string[]; docs: TEntityBase[]; } {
        // Formats entites to be detached from the Db Set.  This function is called by .unlink()

        // Example:  For PouchDB, entities that can be detached must have an _id, _rev, and DocumentType set.  If they are missing these properties, we cannot detach properly and should return errors.
    }

    enrichGenerated(response: IBulkOperationsResponse, entity: TEntityBase): TEntityBase {
        // Takes in the reponse from saving to the database, the entities that were acted on and should set any DB generated values.  NOTE:  Ids should not be auto generated by the database, if they are, we cannot correctly identify an entity, because it has no identifying information for DB Framework to use.  If we cannot identify an entity, then we cannot set DB generated values.

        // Example:  For PouchDB, entities that are saved to the database, this function is used to set the DB generated _rev value.
    }
}
```




## DataContext <a name = "data_context"></a>
A data context is meant to be the orchestrator of all dbsets and manage their operations.  The data context is meant to be light weight, with all of the heavy lifting done in the db sets.  Memory (changes) is not shared across dbsets, meaning, if an entity is being tracked by one data context, other data context's do not know about it.  We can fix that by [linking](#dbset_link) and [unlinking](#dbset_unlink) entities from one context to another.  When an entity is unlinked from from a dbset, changes are not lost with [default change tracking](#default_change_tracking), but are lost with [custom change tracking](#custom_change_tracking).  One way to combat the loss of change tracking with context change tracking is to link the entity and [mark it dirty](#dbset_mark_dirty) afterwards.  

## Methods <a name = "data_context_methods"></a>

### `.saveChanges` <a name = "data_context_save_changes"></a>
Saves all underlying changes to the data store.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.  After changes are saved, entites that were saved can be updated and saved again.

**Type:** `.saveChanges(): Promise<number>`

**Usage:**
```typescript
const context = new MyDataContext();

const [ myAddedItem ] = await context.vehicles.add({
    make: "Tesla",
    model: "Model S",
    year: 2023,
    color: "white",
    trim: "P100D"
});

const count = await context.saveChanges();
```


### `.getAllDocs` <a name = "data_context_get_all_docs"></a>
Returns all documents from the data store

**Type:** `.getAllDocs(): Promise<TEntityBase[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const allDocs = await context.getAllDocs();
```


### `.clearCache` <a name = "data_context_on_clear_cache"></a>
Clears the cache for all dbsets.

**Type:** `.clearCache(): void`

**Usage:**
```typescript
const context = new MyDataContext();

const allDocs = await context.clearCache();
```

### `.hasPendingChanges` <a name = "data_context_has_pending_changes"></a>
Returns boolean flag of whether or not the context has any pending changes.

**Type:** `.hasPendingChanges(): boolean`

**Usage:**
```typescript
const context = new MyDataContext();

const hasPendingChanges = await context.hasPendingChanges();
```

### `.previewChanges` <a name = "data_context_preview_changes"></a>
Returns an object of adds/updates/removes to be persisted to the database.

NOTE: Items returned are a copy of the original, so changes made to these entities will not be saved to the database.

**Type:** `.previewChanges(): Promise<IPreviewChanges<TDocumentType, TEntityBase>>`

**Usage:**
```typescript
const context = new MyDataContext();

const { add, remove, update } = await context.previewChanges();
```

### `.empty` <a name = "data_context_empty"></a>
Empties all objects in the database.  Save changes must be called to actually empty all items from the database.

**Type:** `.empty(): Promise<void>`

**Usage:**
```typescript
const context = new MyDataContext();

await context.empty();
await context.saveChanges();
```

### `.destroyDatabase` <a name = "data_context_destroy_database"></a>
Destroys the underlying database, save changes does not need to be called

**Type:** `.destroyDatabase(): Promise<void>`

**Usage:**
```typescript
const context = new MyDataContext();

await context.destroyDatabase();
```

### `.getDbSet` <a name = "data_context_get_db_set"></a>
Get a db set for the matching document type

**Type:** `.getDbSet(documentType: TDocumentType): IDbSet<string, any, never>`

**Usage:**
```typescript
const context = new MyDataContext();

const dbset = await context.getDbSet(MyDocumentTypes.Vehicle);
```

### protected `.onBeforeSaveChanges` <a name = "data_context_on_before_save_changes"></a>
Function that is called before changes are persisted to the underlying data store.  Entites returned are a reference, meaning, if an entity is changed, that change will make it into the database.  This function has an argument that is a function to help with performance.  The argument `getChanges` must be called to get all changes an any entity tags.  This function can be used for a variety of things.  Most commonly, it is used for history tracking and evaluating entity tags.

**Type:** `.onBeforeSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>):Promise<void>`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    override async onBeforeSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>) {
        const { adds, removes, updates } = getChanges();
        
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
}
```

### protected `.onAfterSaveChanges` <a name = "data_context_on_after_save_changes"></a>
Function that is called after changes are persisted to the underlying data store.  Entites returned are a copy not a reference, meaning any changes will be thrown away and not saved to the data base.  This function has an argument that is a function to help with performance.  The argument `getChanges` must be called to get all changes an any entity tags.  This function is also commonly used for history tracking and evaluating entity tags.

**Type:** `.onAfterSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>): Promise<void>`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    override async onAfterSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>) {
        const { adds, removes, updates } = getChanges();
        
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
}
```

### protected `.onSaveError` <a name = "data_context_on_save_error"></a>
Function that is called when there is an error saving data.

**Type:** `.onSaveError(error: any):Promise<void>`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    override async onSaveError(error: any) {
        
        
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
}
```


## Middleare <a name = "data_context_middleware"></a>
A Data Context has many methods available for developers to create their own middleware.  Some common middleware is logging and history tracking.  

### History Tracking <a name = "data_context_middleware_history_tracking"></a>
Below is an example of history tracking middleware that aims to keep history of another db set even after data has been deleted.  

**Usage**
```typescript
const cacheStore = [];

export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    getAttachmentsHistory() {
        return cacheStore.filter<IDriveItemHistory>(w => w.DocumentType === MyFieldDocumentTypes.Histories);
    }

    protected _mapHistories(item: IVehicle) {

        const result: DeepOmit<IVehicle, "DocumentType" | "_id" | "_rev"> = {
            color: item.color,
            make: item.make,
            model: item.model,
            trim: item.trim,
            year: item.year
        };

        return result;
    }

    protected async _processAdds(adds: IVehicle[]) {

        if (adds.length === 0) {
            return;
        }

        const historyItems = adds.map(w => this._mapHistories(w));
        await this._vehicleHistory.add(...historyItems);
    }

    protected async _processUpdates(updates: IVehicle[]) {

        if (updates.length === 0) {
            return;
        }

        // use instance to create history items with matching ids to their counterparts
        const historyItems = this._vehicleHistory.instance(...updates.map(w => this._mapHistories(w)));

        const ids = historyItems.map(w => w._id);

        // fetch history items so we can get the revision numbers
        const foundHistories = await this._vehicleHistory.get(...ids);

        // PouchDB has a concept of a _rev or revision number, we need to fetch the revision numbers by id 
        // so we can update properly
        const revsMap = foundHistories.reduce((a, v) => ({ ...a, [v._id]: v._rev }), {} as { [key: string]: string })

        const historyUpdates = historyItems.map(w => ({ ...w, _rev: revsMap[w._id] }));

        // unlink any previously linked items
        this._vehicleHistory.unlink(...historyUpdates.filter(w => w._rev != null).map(w => w._id) as ("_id")[]);

        // link any new/existing items
        await this._vehicleHistory.link(...historyUpdates.filter(w => w._rev != null));

        // should not happen, but we want to reconcil any issues here and resave
        await this._vehicleHistory.add(...historyUpdates.filter(w => w._rev == null));
    }

    protected async _processRemovals(removals: IVehicle[]) {
        // do nothing with removals 
    }

    protected override async onBeforeSaveChanges(getChanges: () => { adds: EntityAndTag<IVehicle>[]; removes: EntityAndTag<IVehicle>[]; updates: EntityAndTag<IVehicle>[]; }) {

        const { removes, adds, updates } = getChanges();

        // filter out the records to be added
        const adds = adds.filter(w => w.entity.DocumentType === MyDocumentTypes.Vehicle).map(w => w.entity);
        
        // filter out the records to be updated
        const updates = updates.filter(w => w.entity.DocumentType === MyDocumentTypes.Vehicle).map(w => w.entity);
        
        // filter out the records to be removed
        const removals = removes.filter(w => w.entity.DocumentType === MyDocumentTypes.Vehicle).map(w => w.entity);

        // we can also evaluate tags in case we want to remove something from history when its removed by user interaction vs programmatically removed

        // Create records to add to history
        await this._processAdds(adds);

        // Update existing history records
        await this._processUpdates(updates);

        // Do something with removals (if any)
        await this._processRemovals(removals);
    }

   
    vehicles = this.dbset()
                .default<IVehicle>(MyDocumentTypes.Vehicle)
                .keys(w => w.add("year").add("make").add("model").add("trim"))
                .create();

    private _vehicleHistory = this.dbset()
                .default<IVehicle>(MyDocumentTypes.VehicleHistory)
                .keys(w => w.add("year").add("make").add("model").add("trim"))
                .create();
}
```

### Making Your Own Middleware <a name = "data_context_making_your_own_middleware"></a>
Middleware can be used in DB Framework

## Builder API <a name = "data_context_builder_api"></a>
The Builder API is [fluent API](https://en.wikipedia.org/wiki/Fluent_interface) that allows developers to easily create a data context without providing all of the generics and options necessary when using classes.  The Builde API does have more limitations than using classes, but for a straight forward context, the Builder API is a great solution.

**Usage**
```typescript
const MyDataContext = contextBuilder<DocumentTypes>()
    .useBaseRecord<PouchDbRecord<DocumentTypes>>()
    .useExclusions()
    .usePlugin({ dbName: "test-builder-db" }, PouchDbPlugin)
    .createDefault((Base) => {
        return class extends Base {

            types = {
                map: {} as typeof this.cars.types.map & typeof this.books.types.map
            }

            books = this.dbset().stateful<IBook>(DocumentTypes.Books).create();

            cars = this.dbset().stateful<ICar>(DocumentTypes.Cars).create();
        }
    });
```

## StatefulDataContext <a name = "stateful_data_context"></a>
A stateful data context is meant to keep data store information in sync between memory and the underlying data base.  This can be done with [on before save changes](#data_context_on_before_save_changes) and [on after save changes](#data_context_on_after_save_changes) manually, or DB Framework can manage it for you.  Often times, apps will use a state management middleware, this middleware needs to be kept in sync with the database in some way.  The previously mention functions can be used with existing middleware or this data context can be used.  A [React hook](#react_state_hook) can even be created for ease of use.

## Methods <a name = "stateful_data_context_methods"></a>

### `.addChangeEventListener` <a name = "add_change_event_listener"></a>
Function to add change events that are fired when data is added, removed, updated.  Returns an unregister function, when called, unregisters the event handler. Change events do not need to be re-registered when a context is destroyed, these change events are registered globally.

**Type:** `.addChangeEventListener(documentType: TDocumentType, callback: ChangeHandler): () => void`

**Usage:**
```typescript
const context = new MyDataContext();

const remove = context.addChangeEventListener(documentType, (changes) => {
   
});
```

### `.removeAllEventListeners` <a name = "remove_all_event_listeners"></a>
Will unregister all event listeners.
**Type:** `.removeAllEventListeners(): void`

**Usage:**
```typescript
const context = new MyDataContext();

context.removeAllEventListeners();
```

### `.hydrate` <a name = "stateful_data_context_hydrate"></a>
Populates all DbSet states with existing data from the database.  Must be called every time a new Data Context is created.

**Type:** `.hydrate(): Promise<void>`

**Usage:**
```typescript
const context = new MyDataContext();

await context.hydrate();
```

### `.state` <a name = "stateful_data_context_state"></a>
In memory state for the context.  Must call hydrate to populate the state from the underlying database.

**Type:** `get state(): IDataContextState<TDocumentType, TEntityBase>`

**Usage:**
```typescript
const context = new MyDataContext();

const allData = context.state.all();
```




## Model Declaration <a name = "model_declaration"></a>
Models are declared via classes or interfaces.  Interfaces work the best because the data returned from the database is a POJO (Plain Old JavaScript Object).  A class is not a POJO, therefore we can only use the class for types.  Models must inherit from the base class from the Db Plugin.  Below is an example of a model using the PouchDB Plugin.  PouchDbRecord has 3 properties on it, `_id`, `_rev` and `DocumentType`.

**Example:**
```typescript
export interface SomePouchDbRecord extends PouchDbRecord<"YourDocumentType"> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}
```
## Performance and Profiling <a name = "performance_and_profiling"></a>
DB Framework comes with performance monitoring and profiling tools.  These tools can be used to track performance and profile calls to the data context/dbsets with arguments. The tools are disabled by default, but can be enabled by setting the `performance` or `profiler` properties on the context options.  

Performance monitoring can be enabled by setting the `performance` property to `true`.  Other configuration options are:

- `enabled` - Whether or not to enable performance monitoring.  Defaults to `false`.
- `threshold` - The minimum time in milliseconds to track a performance event.  All events with a time less than the threshold are ignored.  Defaults to -1, which means no threshold is set.
- `only` - An array of event names to track.  Defaults to an empty array, which means all events are tracked.  Should be the name of the function or method being tracked with no arguments or parentheses.

Profiling can be enabled by setting the `profiler` property to `true`.  Other configuration options are:

- `only` - An array of event names to track.  Defaults to an empty array, which means all events are tracked.  Should be the name of the function or method being tracked with no arguments or parentheses.
- `enabled` - Whether or not to enable profiling.  Defaults to `false`.

A custom logger can be set by setting the `logger` property to a function that takes a single argument.  The argument is an object with the following properties:

- `name` - The name of the event being tracked.
- `delta` - The time in milliseconds between the start and end of the event.
- `args` - An array of arguments passed to the event.

NOTE: Performance and profiling can be enabled at the same time, but the performance will not be be accurate due to serialization of logging.

## Concepts <a name = "concepts"></a>
DB Framework is very flexible letting developers use it for more than data interaction.  Though the use of it's API's, DB Framework can have automatic logging, entity tagging, history tracking, and even replace your state management tool.  There is even a [React Hook](#react_state_hook) for state management

## State Management <a name = "state_management"></a>
To use state management, please use the [stateful data context](#stateful_data_context) along with [stateful dbSet](#stateful_dbset).  This will expose the correct API's and functionality to keep an internal state in sync with the database.  One caveat, state must be hydrated on application start, by calling `hydrate()` on each dbset or once on the context.  From there, state will automatically be kept in sync.

**Example:**
```typescript
import { DataContext } from '@agrejus/db-framework';
import { PouchDbPlugin, PouchDbRecord } from '@agrejus/db-framework-plugin-pouchdb';

// Declare document types
export enum MyDocumentTypes {
    Vehicle = "Vehicle",
    VehicleHistory = "VehicleHistory",
    Book = "Book"
}

// Declare models
export interface IVehicle extends PouchDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

export interface IBook extends PouchDbRecord<MyDocumentTypes.Book> {
    author: string;
    publishedDate: string | null;
    year: number;
    status: "pending_publisher" | "approved";
}


// Create Data context using a provider
export class StatefulDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
    books = this.dbset().default<IBook>(MyDocumentTypes.Book).create();
}

// Adding Data
const context = new MyDataContext();

await context.vehicles.add({
    color: "Silver",
    make: "Chevrolet",
    model: "Silverado",
    trim: "RST",
    year: 2021
});

await context.saveChanges();
```

## Logging <a name = "logging"></a>
Logging can be added to the data context and db sets as well though the exposed API's

## Entity Tagging <a name = "entity_tagging"></a>
Logging can be added to the data context and db sets as well though the exposed API's

## History Tracking <a name = "history_tracking"></a>
Logging can be added to the data context and db sets as well though the exposed API's

## Default DbSet <a name = "default_dbset"></a>
A default dbset is the base dbset that all other special dbsets use under the hood.  Stateful dbsets are special dbsets that aim to keep an internal state inline with the database at all times, these dbsets use default dbsets under the hood.

### `.types` <a name = "default_dbset_fields_types"></a>
Types are exposed from a dbset, because in TypeScript, types are not known until db sets are declared.  Once a dbset is declared, we know the types and can expose the types for other usages in the application.

**Type:** `.get types(): { modify: OmittedEntity<TEntity, TExclusions>, result: TEntity, documentType: TEntity["DocumentType"], map: { [DocumentType in TEntity["DocumentType"]]: TEntity }, dbsetType: DbSetType }>`

**Usage:**
```typescript
const context = new MyDataContext();

const types = context.vehicles.types;
```

## Default DbSet Methods <a name = "default_dbset_methods"></a>

### `.info` <a name = "default_dbset_methods_info"></a>
Info is used to information about the dbset, such as it's defaults, keys, readonly status and more.  Please check out the [IDbSetInfo](#dbset_info_type) for all information returned from info.

**Type:** `.info(): IDbSetInfo<TDocumentType, TEntity, TExclusions>`

**Usage:**
```typescript
const context = new MyDataContext();

const info = context.vehicles.info();
```

### `.useCache` <a name = "default_dbset_methods_use_cache"></a>
Used to cache the result of a request.  Null/empty results are not cached.  TTL (in seconds) is the time to live before the cache is cleared and the key is used to identify the cache.  Cache is automatically cleared when the dbset has changes.  If a different dbset has changes, but the cached one does not, the cache will not be cleared.  This is to avoid clearing the cache when it is not needed.

TTL should only be used when the underlying data store consists of HTTP requests and not a database.  Automatic cache clearing solves the need for TTL.  Any TTL caches will be cleared automatically when the dbset has changes, not just on expiration.

**Type:** `.useCache(options: DbSetCacheConfiguration | DbSetTtlCacheConfiguration): this`

**Usage:**
```typescript
const context = new MyDataContext();

const foundWithTtl = context.vehicles.useCache({ ttl: 10, key: "ttl_cache_me" }).find(w => w.year === 2021);
// or
const foundNoTtl = context.vehicles.useCache({ key: "no_ttl_cache_me" }).find(w => w.year === 2021);
```

### `.clearCache` <a name = "default_dbset_methods_clear_cache"></a>
Used to cache the result of a request.  Null/empty results are not cached.  TTL (in seconds) is the time to live before the cache is cleared and the key is used to identify the cache.

**Type:** `.clearCache(...keys: string[]): void`

**Usage:**
```typescript
const context = new MyDataContext();

// clears the entire cache
const found = context.vehicles.clearCache();
```

### `.tag` <a name = "default_dbset_methods_tag"></a>
Tagging allows for developers to tag entities with meta data that can be read in [onBeforeSaveChanges](#data_context_on_before_save_changes) or onAfterSaveChanges.  One use case for tagging is to tag certain data when it's removed to distinguish between a user clicking to remove data or the application automatically removing data on it's own.  We can add a tag to the code behind the click operation and consume the tag in onBeforeSaveChanges or onAfterSaveChanges to do something with it.

**Type:** `.tag(value: unknown): this`

**Usage:**
```typescript
const context = new MyDataContext();

const [ vehicle ] = await context.vehicles.tag("some-value").add({
    color: "Black",
    make: "Toyota",
    model: "Supra",
    trim: "GR",
    year: 2024
});
```

### `.instance` <a name = "default_dbset_methods_instance"></a>
Instance will create one or many untracked instances as if it were actually added to change tracking and queued for saving to the database.  One use case for instace is to use it for ID creation.  These entities are never attached to the data context and therefore never saved to the database unless we later [upsert](#dbset_upsert) them

**Type:** `.instance(...entities: OmittedEntity<TEntity, TExclusions>[]): TEntity[]`

**Usage:**
```typescript
const context = new MyDataContext();

const [ vehicle ] = context.vehicles.instance({
    color: "Black",
    make: "Toyota",
    model: "Supra",
    trim: "GR",
    year: 2024
});
```

### `.add` <a name = "default_dbset_methods_add"></a>
Adds one or many entities into the data context that will be saved when [changes are saved](#data_context_save_changes)

**Type:** `.add(...entities: OmittedEntity<TEntity, TExclusions>[]): Promise<TEntity[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const [ vehicle ] = await context.vehicles.add({
    color: "Black",
    make: "Toyota",
    model: "Supra",
    trim: "GR",
    year: 2024
});
```

### `.upsert` <a name = "default_dbset_methods_upsert"></a>
Upserts (Update or Insert) one or many entities into the data context that will be saved when [changes are saved](#data_context_save_changes).  The data context will do the heavy lifting around the upsert.  If an item is found that already exists in the database, the entire contents of the upserted object will overwrite the existing object.

**Type:** `.upsert(...entities: (OmittedEntity<TEntity, TExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>`

**Usage:**
```typescript
const someUnsureEntity = ...;
const context = new MyDataContext();

const [ vehicle ] = await context.vehicles.upsert(someUnsureEntity);
```

### `.remove` <a name = "default_dbset_methods_remove"></a>
Removes one or many entities by entity or id.  Entities to be removed are stored in the data context until  [changes are saved](#data_context_save_changes).

**Type:** `.remove(...ids: string[]): Promise<void>`
**Type:** `.remove(...entities: TEntity[]): Promise<void>`

### `.empty` <a name = "default_dbset_methods_empty"></a>
Empties an entire db sets data.  Data will only be fully removed when [changes are saved](#data_context_save_changes).

**Type:** `.empty(): Promise<void>`

**Usage:**
```typescript
const context = new MyDataContext();

await context.vehicles.empty();
```

### `.all` <a name = "default_dbset_methods_all"></a>
Gets all data that is linked to a db set from the underlying data store.  Other document types are not returned, only the document type of the calling db set.
**Type:** `.all(): Promise<TEntity[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const allData = await context.vehicles.all();
```

### `.filter` <a name = "default_dbset_methods_filter"></a>
Filters the underlying data store by document type that matches the given filter.

**Type:** `.filter(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const all2021Vehicles = await context.vehicles.filter(w => w.year === 2021);
```

### `.isMatch` <a name = "default_dbset_methods_is_match"></a>

**Type:** `.isMatch(first: TEntity, second: any): boolean`

**Usage:**
```typescript
const context = new MyDataContext();

const foundOne = await context.vehicles.find(w => w.year === 2021);
const foundTwo = await context.vehicles.find(w => w.year === 2022);
const result = context.vehicles.isMatch(foundOne, foundTwo)
```

### `.match` <a name = "default_dbset_methods_match"></a>
Match is a way to take in entities and see if they belong in a db set.  The best usage is to get all document from a data store and use this function to separate out the documents by type.  See the example below.

**Type:** `.match(...items: IDbRecordBase[]): TEntity[]`

**Usage:**
```typescript
const context = new MyDataContext();

const allData = await context.getAllDocs();

const vehiclesOnly = context.vehicles.match(...allData);
const booksOnly = context.books.match(...allData);

```

### `.get` <a name = "default_dbset_methods_get"></a>
Get one or more entities by ID.

**Type:** `.get(...ids: string[]): Promise<TEntity[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const found = await context.vehicles.get("some_id");
```

### `.find` <a name = "default_dbset_methods_find"></a>
Find an entity by the selection criteria

**Type:** `.find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined>`

**Usage:**
```typescript
const context = new MyDataContext();

const found = await context.vehicles.find(w => w.year === 2021);
```

### `.unlink` <a name = "default_dbset_methods_unlink"></a>
Unlinks or removes an object from a given data context.  Once unlinked, any changes are not tracked or saved.

**Type:** `.unlink(...entities: TEntity[]): void`

**Usage:**
```typescript
const context = new MyDataContext();

const found = await context.vehicles.find(w => w.year === 2021);

if (found != null) {
    context.vehicles.unlink(found);
}
```

### `.markDirty` <a name = "default_dbset_methods_mark_dirty"></a>
Marks one or more entities as dirty so they are saved to the underlying data store even if no changes were detected.

**Type:** `.markDirty(...entities: TEntity[]): Promise<TEntity[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const found = await context.vehicles.find(w => w.year === 2021);

if (found != null) {
    await context.vehicles.markDirty(found);
}
```

### `.link` <a name = "default_dbset_methods_link"></a>
Links one or more entites to the data context, after the entity is linked changes are tracked and changes can be made to the entity and saved.

**Type:** `.link(...entities: TEntity[]): Promise<TEntity[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const someEntityFromAnotherDataContext = ...;

await context.vehicles.link(someEntityFromAnotherDataContext);
```

### `.linkUnsafe` <a name = "default_dbset_methods_link_unsafe"></a>
Links one or more entites to the data context, after the entity is linked changes are tracked and changes can be made to the entity and saved.  This is the unsafe version of link because we will link exactly what is passed in.

**Type:** `.linkUnsafe(...entities: TEntity[]): Promise<TEntity[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const someEntityFromAnotherDataContext = ...;

await context.vehicles.linkUnsafe(someEntityFromAnotherDataContext);
```

### `.isLinked` <a name = "default_dbset_methods_is_linked"></a>
Returns a boolean value of whether or not an entity is linked to the context

**Type:** `.isLinked(entity: TEntity): boolean`

**Usage:**
```typescript
const context = new MyDataContext();

const someEntityFromAnotherDataContext = ...;

const isLinked = context.vehicles.isLinked(someEntityFromAnotherDataContext);
```

### `.first` <a name = "default_dbset_methods_first"></a>
Returns the first item in the data store for the db set.

**Type:** `.first(): Promise<TEntity>`

**Usage:**
```typescript
const context = new MyDataContext();

const first = await context.vehicles.first();
```

### `.pluck` <a name = "default_dbset_methods_pluck"></a>
Returns the property value for the entity matching the selector

**Type:** `.pluck<TKey extends keyof TEntity>(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean, propertySelector: TKey): Promise<TEntity>`

**Usage:**
```typescript
const context = new MyDataContext();

const model = await context.vehicles.pluck(w => w.make === "Tesla", "model");
```

### `.serialize` <a name = "default_dbset_methods_serialize"></a>
Serializes an entity based on the dbset builder serializer provided so the entity can be saved to the database.  If no serializer is provided, the original entity will be returned.  The serializer can be used to convert properties before the entity is saved, most commmonly, dates are converted to strings before it is saved.

**Type:** `.serialize(...entities: TEntity[]): any[]`

**Usage:**
```typescript
const context = new MyDataContext();

const item = ...;

const mySerializedItem = await context.vehicles.serialize(item);
```

### `.deserialize` <a name = "default_dbset_methods_deserialize"></a>
Deserializes an entity based on the dbset builder serializer provided so the entity can be saved to the database.  If no deserializer is provided, the original entity will be returned.  The deserializer can be used to convert properties after the entity is saved, most commmonly, strings are converted to dates after it is returned from the database.

**Type:** `.deserialize(...entities: any[]): TEntity[]`

**Usage:**
```typescript
const context = new MyDataContext();

const model = await context.vehicles.pluck(w => w.make === "Tesla", "model");
```


## Stateful DbSet <a name = "stateful_dbset"></a>
A Stateful Dbset is meant to keep an internal local state and the database in constant sync with one another.

### `.hydrate` <a name = "stateful_dbset_builder_api_methods_hydrate"></a>
Used to hydrate state from the database and store it locally.  Must be called on application start so the stateful db set can track changes properly.  

**Type:** `.hydrate(): Promise<number>`

**Usage:**
```typescript
const context = new MyDataContext();

const hydratedDocumentsCount = await context.vehicles.hydrate();
```

### `.state` <a name = "stateful_dbset_builder_api_fields_state"></a>
Same as [context state](#stateful_data_context_state), but has one extra method allowing the addition of remote or untracked documents to the local state.  This is useful if there are documents that do not exist in the database, but rather in a remote store of some kind.  We can fetch documents from a remote store and add them to the state.  These documents are only stored in state, they are never persisted to the database.  They are referred to as remote documents.  Save changes does not need to be called since these documents are never stored in the underlying data store.

**Type:** `state: IDbSetState<TDocumentType, TEntity, TExclusions`

**Usage:**
```typescript
const context = new MyDataContext();

const [ vehicle ] = await context.vehicles.state.add({
    color: "White",
    make: "Chevrolet",
    model: "Colorado",
    trim: "ZR-2",
    year: 2022
});
```


## Default DbSet Builder API <a name = "default_dbset_builder"></a>
The Default DbSet Builder API is a [fluent API](https://en.wikipedia.org/wiki/Fluent_interface) that is used to declare and create db sets. This API comes with many different options to customize a db set.  Developers can use as little or as many options available to them.



### `.readonly` <a name = "default_dbset_builder_api_readonly"></a>
By marking a db set as readonly, it allows only inserts and removes from the underlying data store.  Data cannot be updated and measures are taken such as [object freezing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) and any changes are ignored on save only for the db set it is created with.

**Type:** `.readonly(): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle)
                        .readonly()
                        .create();
}
```

### `.keys` <a name = "default_dbset_builder_api_keys"></a>
Key generation can be customized to almost anything.  Out of the box, the id property can be a composite key made up of other properties, auto generated by the context, or have no key at all meaning the document type is the key.  Having no key is useful when we only want a maximum of one document per db set.  

**Type:** `.keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => (IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>)): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    // composite key
    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle)
                        .keys(w => w.add("year").add("make"))
                        .create();

    // auto generated key (default)
    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle)
                        .keys(w => w.auto())
                        .create();

    // no key
    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle)
                        .keys(w => w.none())
                        .create();
}
```

### `.defaults` <a name = "default_dbset_builder_api_defaults"></a>
Defaults are very powerful when paired with exclusions and can be used to set default values when data is added or retrieved from the database.  We can also specify defaults on adding/retrieving or both.

**Type:** `.defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions>): DefaultDbSetBuilder`

**Type:** `.defaults(value: DeepPartial<OmittedEntity<TEntity, TExclusions>>): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    // When documents are added, we do not need to set the make, it will automatically be set to "Tesla"
    teslaVehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle)
                        .defaults({ make: "Tesla" })
                        .exclude("make")
                        .create();
}
```

### `.exclude` <a name = "default_dbset_builder_api_exclude"></a>
Exclude is almost always paired with defaults and can be used to exclude the requirement of properties when adding or upserting documents.

**Type:** `.exclude<T extends keyof TEntity>(...exclusions: T[]): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    // When documents are added, we do not need to set the make, it will automatically be set to "Tesla"
    teslaVehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle)
                        .defaults({ make: "Tesla" })
                        .exclude("make")
                        .create();
}
```

### `.serialize` <a name = "default_dbset_builder_api_serialize"></a>
Serialize is used to change the entity before it is saved.  For example, if we want to turn a Date object into a string, we can use serialization.

**Type:** `.serialize(serializer: (entity: TEntity) => any): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    books = this.dbset().default<IBook>(MyDocumentTypes.Book)
                .serialize(w => {
                    const result = w as any;

                    if (w.publishDate != null) {
                        result.publishDate = w.publishDate.toISOString();
                    }

                    return result
                })
                .create();
}
```

### `.deserialize` <a name = "default_dbset_builder_api_deserialize"></a>
Deserialize is used to change the entity after it is retrieved from the database.  For example, if we want to turn a string into a Date object, we can use deserialization.

**Type:** `.deserialize(deserializer: (entity: any) => TEntity): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    books = this.dbset().default<IBook>(MyDocumentTypes.Book)
                .deserialize((w) => {
                    
                    w.publishDate = w.publishDate == null ? null : new Date(w.publishDate);

                    return w
                })
                .create();
}
```

### `.enhance` <a name = "default_dbset_builder_api_enhance"></a>
Enhance can be used to add more properties (untracked) or even functions to an object.  If you have an expiration date on an entity and you want to check if its expired, instead of adding a helper function, the entity can be enhanced with the function.  All properties will be ignored and not saved to the database.  All properties are required and cannot be optional.
**Type:** `.enhance<TEnhanced>(enhancer: (entity: TEntity) => Required<TEnhanced>): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    // All books will be enhanced with the new function
    books = this.dbset().default<IBook>(MyDocumentTypes.Book)
                .enhance((w) => {
                    return {
                        isSameYear: () => {
                            return w.year === new Date().getFullYear();
                        }
                    }
                })
                .create();
}
```

### `.filter` <a name = "default_dbset_builder_api_filter"></a>
Filter can be used to set a permanent filter on all documents in the db set.  This is useful if the data is dependent on configuration flags and the all data returned needs to change based on the configuration flags.

**Type:** `.filter(selector: EntitySelector<TDocumentType, TEntity>): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    // Set a filter to only return books from 2021
    _2021Books = this.dbset().default<IBook>(MyDocumentTypes.Book)
                .filter(w => w.year === 2021)
                .create();
}
```

### `.getChanges` <a name = "default_dbset_builder_api_get_changes"></a>
Used to enable custom change tracking on the db set.  The provided function will be used to return a partial object with only the changed properties and their values or null if nothing has changed.  Useful when we want to exclude properties from change tracking, yet allow them into the database.

**Type:** `.getChanges(comparison: (original: TEntity, next: TEntity) => DeepPartial<TEntity> | null): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    // Only save changes to the entity when the year changes
    books = this.dbset().default<IBook>(MyDocumentTypes.Book)
                .hasChanged((original, next) => {

                    if (original.year !== next.year) {
                        return { year: next.year } // show that only the year has changed
                    }

                    return null;// no changes
                })
                .create();
}
```

### `.create` <a name = "default_dbset_builder_api_create"></a>
Must be called to create the db set and use it within the context.  Can be used to extend the functionality of the existing dbset or even override functionality.

**Type:** `.create(): TResult`
**Type:** `.create(extend: (i: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => IDbSet<TDocumentType, TEntity, TExclusions>, args: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TExtension): TResult`

**Usage (No Extension):**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    books = this.dbset().default<IBook>(MyDocumentTypes.Book).create();
}
```

**Usage (With Extension):**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    books = this.dbset().default<IBook>(MyDocumentTypes.Book)
                .create((Instance, props) => {
                    return new class extends Instance {

                        constructor() {
                            super(props);
                        }

                        // override existing method
                        override async all() {
                            // custom code here
                            return await super.all();
                        }

                        // new method will be available wherever the db set is used
                        someNewMethod() {
                            // custom code here
                        }
                    }
                });
}
```


## Stateful DbSet Builder <a name = "stateful_dbset_builder"></a>
Used to create a stateful db set that stores data locally and in the database.  It is the responsibility of the db set to keep changes in sync between the database and the local data store.  Enables a redux like experience with the db sets.

### `.onChange` <a name = "default_dbset_builder_create"></a>

**Type:** `.onChange(callback: DbSetRemoteOnChangeEvent<TDocumentType, TEntity>): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    onChange(documentType: MyDocumentTypes, type: DbSetChangeType, data: DbSetRemoteChanges<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>>) {
        // all changes can now run though this function and we can act on them if needed
    }

    books = this.dbset().default<IBook>(MyDocumentTypes.Book)
                .onChange((documentType, changeType, changes) => { this.onChange(documentType, changeType, changes) })
                .create();
}
```

### React State Hook <a name = "react_state_hook"></a>

```typescript
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AttachmentsDataContext } from './MyDataContext';
import { IStoreDbSet } from '@agrejus/db-framework';

const context = new MyDataContext();

export const useSelector = <TDocumentType extends keyof typeof context.types.map, TEntity extends typeof context.types.map[TDocumentType]>(documentType: TDocumentType, selector?: (data: TEntity) => boolean): TEntity[] => {

    // hook into on change event
    const dbset = context.getDbSet(documentType) as IStoreDbSet<TDocumentType, any, never>;
    const [data, setData] = useState<TEntity[]>(dbset.store.all());

    useEffect(() => {

        // need to hook into memory store and on change should feed back all data?
        const remove = context.addChangeEventListener(documentType, (changes) => {

            const { all } = changes;

            if (selector != null) {

                const changes = all.filter(w => selector(w as any) === true)
                setData(changes)
                return;
            }

            setData(all);
        });

        return () => {
            remove();
        }

    }, [])

    return []
}

// Must use this context everywhere
export const myDataContext = context;

// usage
const Component = () => {

    const vehciles = useSelector(MyDocumentTypes.Vehicles)

    return <div>We have {vehciles.length} vehicles</div>
} 
```

## Authors <a name = "authors"></a>
- [@agrejus](https://github.com/agrejus)

## Supporting Type Declarations

### `IDbSetInfo` <a name = "dbset_info_type"></a>
```typescript
export interface IDbSetInfo<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> {
    DocumentType: TDocumentType,
    IdKeys: EntityIdKeys<TDocumentType, TEntity>,
    Defaults: DbSetPickDefaultActionRequired<TDocumentType, TEntity, TExclusions>,
    KeyType: DbSetKeyType;
    Map: PropertyMap<TDocumentType, TEntity, any>[];
    Readonly: boolean;
}
```

See also the list of [contributors](https://github.com/agrejus/db-framework/contributors) who participated in this project.