<!-- <p align="center">
  <a href="" rel="noopener">
 <img width=200px height=200px src="https://i.imgur.com/6wj0hh6.jpg" alt="Project logo"></a>
</p> -->

<h3 align="center">Db Framework</h3>

<div align="center">

  [![Status](https://img.shields.io/badge/status-active-success.svg)]() 
  [![GitHub Issues](https://img.shields.io/github/issues/agrejus/db-framework.svg)](https://github.com/agrejus/db-framework/issues)
  [![GitHub Pull Requests](https://img.shields.io/github/issues-pr/agrejus/db-framework.svg)](https://github.com/agrejus/db-framework/pulls)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

---

<p align="center"> Create a versatile Data Interaction Layer for Node.js and web development that seamlessly handles database interactions. Effortlessly abstract database interactions using the DB Framework, simplifying the process of switching databases or incorporating two different databases.
    <br> 
</p>

## Table of Contents
- [About](#about)
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
    - [Get All Documents](#query_data_get_all_docs)
- [Change Tracking](#change_tracking)
    - [Default Change Tracking](#default_change_tracking)
    - [Custom Change Tracking](#custom_change_tracking)
    - [Readonly Change Tracking](#readonly_change_tracking)
- [Database Plugins](#database_plugins)
    - [Memory Database Plugin](#database_plugins_memory)
    - [PouchDB Database Plugin](#database_plugins_pouchdb)
    - [Local Storage Database Plugin](#database_plugins_local_storage)
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
    - [Middleware](#data_context_middleware)
        - [History Tracking](#data_context_middleware_history_tracking)
        - [Making Your Own Middleware](#data_context_making_your_own_middleware)
    - [Builder API](#data_context_builder_api)
- [Stateful Data Context](#test)
    - [Methods](#test)
        - [Remove](#test)
        - [Update](#test)
- [Model Declaration](#test)
- [Concepts](#test)
    - [Redux Replacement](#test)
    - [Logging](#test)
    - [Entity Tagging](#test)
    - [History Tracking](#test)
- [DbSet](#test)
    - [Builder API](#test)
        - [DbSet](#test)
    - [Methods](#test)
        - [DbSet](#test)
    - [Fields](#test)
        - [Types](#test)
    - [Customization](#test)
- [Stateful DbSet](#test)
    - [Builder API](#test)
        - [DbSet](#test)
    - [Methods](#test)
        - [DbSet](#test)
- [FAQ](#test)
- [Change Log](./changelog.md)
- [Authors](#authors)

## About <a name = "about"></a>
Db Framework is a TypeScript first ORM desiged to wrap existing database frameworks such as PouchDB to augment its functionality.  Db Framework aims to take the headaches out of other ORMs and provide repeatable processes for CRUD operations with minimal code.  Inspired by .NET's Entity Framework, Db Framework operates the same way and tries to keep method names as close as possible.

Db Framework provides a ton of flexibility, even going as far as offering a local state store (think Redux).

Why it's great:
- Works with many different databases
- Can easily add/augment current functionality
- Can create plugins to use with any database
- Fast, uses bulk operations for all data manipulation
- Works in NodeJS and all modern browsers

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
Uses a custom [user defined comparator](#default_dbset_builder_has_changed) function to track changes in entities.  Changes are stored at the context level, not the entity.  If an entity is passed from one context to another via [linking](#dbset_link), changes are lost and the object needs to be [marked dirty](#dbset_mark_dirty) to recognize changes have been made.  This form of change tracking is great because all objects are plain old JavaScript objects that can be easily serialized.
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

**Package:** [@agrejus/db-framework-plugin-memory](https://www.npmjs.com/package/@agrejus/db-framework-plugin-memory)

### PouchDB Plugin <a name = "data_context_save_changes"></a>
Saves all underlying changes to the adapter defined in the PouchDB plugin.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.

**Package:** [@agrejus/db-framework-plugin-pouchdb](https://www.npmjs.com/package/@agrejus/db-framework-plugin-pouchdb)

### Local Storage Plugin <a name = "data_context_save_changes"></a>
Saves all underlying changes to local storage.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.

**Package:** [@agrejus/db-framework-plugin-local-storage](https://www.npmjs.com/package/@agrejus/db-framework-plugin-local-storage)

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

    async bulkOperations(operations: { adds: TEntityBase[]; removes: TEntityBase[]; updates: TEntityBase[]; }): Promise<IBulkOperationsResponse> {
        // Performs bulk operation, meaning, all adds/removes/updates are done in one operation.  For other databases that do not have this functionality, adds/removes/updates can be done separately.

        // Example:  For PouchDB, adds/removes/updates can all be done in one operation, so we group all items together and perform the operation
    }

    async prepareAttachments(...entities: TEntityBase[]): Promise<{ ok: boolean, errors: string[], docs: TEntityBase[] }> {
        // Prepares entities to be attached to the Db Set.  Used when .link() is called on a Db Set.  This method is responsible for finding the existing entity and merging it with the entity passed into this function.  Should set any propertyes and return the result of the merge

        // Example:  For PouchDB, we try and find existing documents by Id, then we use only the _rev property from the found document, and set it on the entity from the parameters.  This function also verifies that the _rev, DocumentType, and _id properties are set.  We look up the entity, because we want to ensure the entity being passed in has the latest _rev so it is saved properly
    }

    formatDeletions(...entities: TEntityBase[]): TEntityBase[] {
        // Some databases only do soft deletes and work by setting an flag like _deleted to deleted items.  If this is not the case, we can just return the passed in entites.  Otherise format entites as needed so they can be deleted properly.

        // Example:  For PouchDB, this function maps entites to remove all properties but _id, _rev, and adds the _deleted flag
    }

    isOperationAllowed(entity: TEntityBase, operation: 'add'): boolean {
        // Given an entity and operation, we can determine if we are allowed to do an operation.  This function is used when .add() is called on a Db Set.  

        // Example: For PouchDB, this function is used to check whether or not an entity has a _rev property set, if it does, that means it is not an add because that property is set only after saving an entity.
    }

    prepareDetachments(...entities: TEntityBase[]): { ok: boolean; errors: string[]; docs: TEntityBase[]; } {
        // Formats entites to be detached from the Db Set.  This function is called by .unlink()

        // Example:  For PouchDB, entities that can be detached must have an _id, _rev, and DocumentType set.  If they are missing these properties, we cannot detach properly and should return errors.
    }

    setDbGeneratedValues(response: IBulkOperationsResponse, entities: TEntityBase[]): void {
        // Takes in the reponse from saving to the database, the entities that were acted on and should set any DB generated values.  NOTE:  Ids should not be auto generated by the database, if they are, we cannot correctly identify an entity, because it has no identifying information.  If we cannot identify an entity, then we cannot set DB generated values.

        // Example:  For PouchDB, entities that are saved to the database, this function is used to set the DB generated _rev value.
    }
}
```




## DataContext <a name = "data_context"></a>
A data context is meant to be the orchestrator of all dbsets and manage their operations.  The data context is meant to be light weight, with all of the heavy lifting done in the db sets.  Memory (changes) is not shared across dbsets, meaning, if an entity is being tracked by one data context, other data context's do not know about it.  We can fix that by [linking](#dbset_link) and [unlinking](#dbset_unlink) entities from one context to another.  When an entity is unlinked from from a dbset, changes are not lost with [default change tracking](#default_change_tracking), but are lost with [custom change tracking](#custom_change_tracking).  One way to combat the loss of change tracking with context change tracking is to link the entity and [mark it dirty](#dbset_mark_dirty) afterwards.  

## Methonds <a name = "data_context_methods"></a>

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

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    getAttachmentsHistory() {
        return cacheStore.filter<IDriveItemHistory>(w => w.DocumentType === KorTerraFieldDocumentTypes.KorTerraDriveAttachmentsHistory);
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








## Default DbSet <a name = "default_dbset"></a>

### `.types` <a name = "dbset_types"></a>
Types are exposed from a dbset, because in TypeScript, types are not known until db sets are declared.  Once a dbset is declared, we know the types and can expose the types for other usages in the application.

**Type:** `.get types(): { modify: OmittedEntity<TEntity, TExclusions>, result: TEntity, documentType: TEntity["DocumentType"], map: { [DocumentType in TEntity["DocumentType"]]: TEntity }, dbsetType: DbSetType }>`

**Usage:**
```typescript
const context = new MyDataContext();

const types = context.vehicles.types;
```

### `.info` <a name = "dbset_info"></a>
Info is used to information about the dbset, such as it's defaults, keys, readonly status and more.  Please check out the [IDbSetInfo](#dbset_info_type) for all information returned from info.

**Type:** `.info(): IDbSetInfo<TDocumentType, TEntity, TExclusions>`

**Usage:**
```typescript
const context = new MyDataContext();

const info = context.vehicles.info();
```

### `.tag` <a name = "dbset_tag"></a>
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

### `.instance` <a name = "dbset_instance"></a>
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

### `.add` <a name = "dbset_add"></a>
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

### `.upsert` <a name = "dbset_upsert"></a>
Upserts (Update or Insert) one or many entities into the data context that will be saved when [changes are saved](#data_context_save_changes).  The data context will do the heavy lifting around the upsert.  If an item is found that already exists in the database, the entire contents of the upserted object will overwrite the existing object.

**Type:** `.upsert(...entities: (OmittedEntity<TEntity, TExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>`

**Usage:**
```typescript
const someUnsureEntity = ...;
const context = new MyDataContext();

const [ vehicle ] = await context.vehicles.upsert(someUnsureEntity);
```

### `.remove` <a name = "dbset_remove"></a>
Removes one or many entities by entity or id.  Entities to be removed are stored in the data context until  [changes are saved](#data_context_save_changes).

**Type:** `.remove(...ids: string[]): Promise<void>`
**Type:** `.remove(...entities: TEntity[]): Promise<void>`

### `.empty` <a name = "dbset_empty"></a>
Empties an entire db sets data.  Data will only be fully removed when [changes are saved](#data_context_save_changes).

**Type:** `.empty(): Promise<void>`

**Usage:**
```typescript
const context = new MyDataContext();

await context.vehicles.empty();
```

### `.all` <a name = "dbset_all"></a>
Gets all data that is linked to a db set from the underlying data store.  Other document types are not returned, only the document type of the calling db set.
**Type:** `.all(): Promise<TEntity[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const allData = await context.vehicles.all();
```

### `.filter` <a name = "dbset_filter"></a>
Filters the underlying data store by document type that matches the given filter.

**Type:** `.filter(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const all2021Vehicles = await context.vehicles.filter(w => w.year === 2021);
```

### `.isMatch` <a name = "dbset_is_match"></a>

**Type:** `.isMatch(first: TEntity, second: any): boolean`

**Usage:**
```typescript
const context = new MyDataContext();

const foundOne = await context.vehicles.find(w => w.year === 2021);
const foundTwo = await context.vehicles.find(w => w.year === 2022);
const result = context.vehicles.isMatch(foundOne, foundTwo)
```

### `.match` <a name = "dbset_match"></a>
Match is a way to take in entities and see if they belong in a db set.  The best usage is to get all document from a data store and use this function to separate out the documents by type.  See the example below.

**Type:** `.match(...items: IDbRecordBase[]): TEntity[]`

**Usage:**
```typescript
const context = new MyDataContext();

const allData = await context.getAllDocs();

const vehiclesOnly = context.vehicles.match(...allData);
const booksOnly = context.books.match(...allData);

```

### `.get` <a name = "dbset_get"></a>
Get one or more entities by ID.

**Type:** `.get(...ids: string[]): Promise<TEntity[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const found = await context.vehicles.get("some_id");
```

### `.find` <a name = "dbset_find"></a>
Find an entity by the selection criteria

**Type:** `.find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined>`

**Usage:**
```typescript
const context = new MyDataContext();

const found = await context.vehicles.find(w => w.year === 2021);
```

### `.unlink` <a name = "dbset_unlink"></a>
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

### `.markDirty` <a name = "dbset_mark_dirty"></a>
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

### `.link` <a name = "dbset_link"></a>
Links one or more entites to the data context, after the entity is linked changes are tracked and changes can be made to the entity and saved.

**Type:** `.link(...entities: TEntity[]): Promise<TEntity[]>`

**Usage:**
```typescript
const context = new MyDataContext();

const someEntityFromAnotherDataContext = ...;

await context.vehicles.link(someEntityFromAnotherDataContext);
```

### `.first` <a name = "dbset_first"></a>
Returns the first item in the data store for the db set.

**Type:** `.first(): Promise<TEntity>`

**Usage:**
```typescript
const context = new MyDataContext();

const first = await context.vehicles.first();
```


## Stateful DbSet <a name = "stateful_dbset"></a>


### `.hydrate` <a name = "stateful_dbset_hydrate"></a>
Used to hydrate state from the database and store it locally.  Must be called on application start so the stateful db set can track changes properly.  

**Type:** `.hydrate(): Promise<number>`

**Usage:**
```typescript
const context = new MyDataContext();

const hydratedDocumentsCount = await context.vehicles.hydrate();
```

### `.state` <a name = "stateful_dbset_state"></a>
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

### `.readonly` <a name = "default_dbset_builder_first"></a>
By marking a db set as readonly, it allows only inserts and removes from the underlying data store.  Data cannot be updated and measures are taken such as [object freezing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) and any changes are ignored on save only for the db set it is created with.

**Type:** `.readonly(): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle)
                        .readonly()
                        .create();
}
```

### `.keys` <a name = "default_dbset_builder_keys"></a>
Key generation can be customized to almost anything.  Out of the box, the id property can be a composite key made up of other properties, auto generated by the context, or have no key at all meaning the document type is the key.  Having no key is useful when we only want a maximum of one document per db set.  

**Type:** `.keys(builder: (b: IIdBuilderBase<TDocumentType, TEntity>) => (IChainIdBuilder<TDocumentType, TEntity> | ITerminateIdBuilder<TDocumentType, TEntity>)): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

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

### `.defaults` <a name = "default_dbset_builder_defaults"></a>
Defaults are very powerful when paired with exclusions and can be used to set default values when data is added or retrieved from the database.  We can also specify defaults on adding/retrieving or both.

**Type:** `.defaults(value: DbSetPickDefaultActionOptional<TDocumentType, TEntity, TExclusions>): DefaultDbSetBuilder`

**Type:** `.defaults(value: DeepPartial<OmittedEntity<TEntity, TExclusions>>): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

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

### `.exclude` <a name = "default_dbset_builder_exclude"></a>
Exclude is almost always paired with defaults and can be used to exclude the requirement of properties when adding or upserting documents.

**Type:** `.exclude<T extends keyof TEntity>(...exclusions: T[]): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

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

### `.map` <a name = "default_dbset_builder_map"></a>
Map is used to change or map property values to different values.  For example, if we want to turn a string date into a JavaScript date object, we can use mapping for that.

**Type:** `.map<T extends keyof TEntity>(propertyMap: PropertyMap<TDocumentType, TEntity, T>): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    books = this.dbset().default<IBook>(MyDocumentTypes.Book)
                .map({ property: "publishedDate", map: w => w != null ? new Date(w) : undefined })
                .create();
}
```

### `.extend` <a name = "default_dbset_builder_extend"></a>
Extending is the most powerful API method available in the builder API.  Extending allows developers to add or override functionality of the db set.

**Type:** `.extend<TExtension extends IDbSet<TDocumentType, TEntity, TExclusions>>(extend: (i: new (props: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TResult, args: IDbSetProps<TDocumentType, TEntity, TExclusions>) => TExtension): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    books = this.dbset().default<IBook>(MyDocumentTypes.Book)
                .extend((Instance, props) => {
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
                })
                .create();
}
```

### `.filter` <a name = "default_dbset_builder_filter"></a>
Filter can be used to set a permanent filter on all documents in the db set.  This is useful if the data is dependent on configuration flags and the all data returned needs to change based on the configuration flags.

**Type:** `.filter(selector: EntitySelector<TDocumentType, TEntity>): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    // Set a filter to only return books from 2021
    _2021Books = this.dbset().default<IBook>(MyDocumentTypes.Book)
                .filter(w => w.year === 2021)
                .create();
}
```

### `.hasChanged` <a name = "default_dbset_builder_has_changed"></a>
Used to enable custom change tracking on the db set.  The provided comparator function will be used to determine if the entity has any changes.  Useful when we want to exclude properties from change tracking, yet allow them into the database.

**Type:** `.hasChanged(comparison: EntityComparator<TDocumentType, TEntity>): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    // Only save changes to the entity when the year changes
    books = this.dbset().default<IBook>(MyDocumentTypes.Book)
                .hasChanged((a, b) => a.year !== b.year)
                .create();
}
```

### `.create` <a name = "default_dbset_builder_create"></a>
Must be called to create the db set and use it within the context

**Type:** `.create(): TResult`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    books = this.dbset().default<IBook>(MyDocumentTypes.Book).create();
}
```



## Stateful DbSet Builder <a name = "stateful_dbset_builder"></a>
Used to create a stateful db set that stores data locally and in the database.  It is the responsibility of the db set to keep changes in sync between the database and the local data store.  Enables a redux like experience with the db sets.

### `.onChange` <a name = "default_dbset_builder_create"></a>

**Type:** `.onChange(callback: DbSetRemoteOnChangeEvent<TDocumentType, TEntity>): DefaultDbSetBuilder`

**Usage:**
```typescript
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

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