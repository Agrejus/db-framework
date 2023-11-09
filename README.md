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

<p align="center"> Database agnostic Data Layer for NodeJS and the web
    <br> 
</p>

## Table of Contents
- [About](#about)
- [Getting Started](#getting_started)
  - [Installation](#installation)
  - [Basic Usage](#basic_usage_example)
- [Saving Data](#test)
    - [Add](#test)
    - [Remove](#test)
    - [Update](#test)
- [Change Tracking](#test)
    - [Entity Change Tracking](#test)
    - [Context Change Tracking](#test)
- [Database Plugins](#test)
    - [Memory Database Plugin](#test)
    - [PouchDB Database Plugin](#test)
    - [Local Storage Database Plugin](#test)
    - [Custom Database Plugin](#test)
- [Data Context](#test)
    - [Methods](#test)
        - [Remove](#test)
        - [Update](#test)
    - [Middleware](#test)
    - [Builder API](#test)
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
Getting started with Db Framework is very easy and fast.  Create your models, document types, declare your DbSet and profit!  See a [working example below](#basic_usage_example)

### Installation <a name = "installation"></a>
```
npm install @agrejus/db-framework
```

Install a db provider
- PouchDB - `npm i @agrejus/db-framework-plugin-pouchdb`
- Memory - `npm i @agrejus/db-framework-plugin-memory`
- Local Storage - `npm i @agrejus/db-framework-plugin-localstorage`

### Basic Usage Example <a name="basic_usage_example"></a>
Example using PouchDB
```typescript
import { DataContext, IDbRecord } from '@agrejus/db-framework';
import { PouchDbPlugin } from '@agrejus/db-framework-plugin-pouchdb';

// Declare document types
export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

// Declare models
export interface IVehicle extends IDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

// Create Data context using a provider
export class MyDataContext extends DataContext<MyDocumentTypes, IDbRecord<MyDocumentTypes.Vehicle>> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
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
DB Framework makes it very easy to modify data.  Simply use the appropiate DbSet to create/update/delete a record.  Updating data can change depending on the change tracking being used.  [Entity Change Tracking]() or [Context Change Tracking]() can be used to track changes on an entity.  By default Entity Change Tracking is used, but if serialization becomes an issue, please use Context Change Tracking.

### Create <a name = "create_data"></a>
Much like the getting started example, the below example demonstrates how to insert a record in the underlying datastore. Please see [.add()]() for more examples

```typescript
import { DataContext, IDbRecord } from '@agrejus/db-framework';
import { PouchDbPlugin } from '@agrejus/db-framework-plugin-pouchdb';

export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

export interface IVehicle extends IDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

export class MyDataContext extends DataContext<MyDocumentTypes, IDbRecord<MyDocumentTypes.Vehicle>> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
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

// Once Save Changes is called, all changes are persisted into the database
```

### Update <a name = "update_data"></a>
The below example demonstrates how to find and update a record in the underlying datastore. Please see the DbSet query methods for more examples.

```typescript
import { DataContext, IDbRecord } from '@agrejus/db-framework';
import { PouchDbPlugin } from '@agrejus/db-framework-plugin-pouchdb';

export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

export interface IVehicle extends IDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

export class MyDataContext extends DataContext<MyDocumentTypes, IDbRecord<MyDocumentTypes.Vehicle>> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
}

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
import { DataContext, IDbRecord } from '@agrejus/db-framework';
import { PouchDbPlugin } from '@agrejus/db-framework-plugin-pouchdb';

export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

export interface IVehicle extends IDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

export class MyDataContext extends DataContext<MyDocumentTypes, IDbRecord<MyDocumentTypes.Vehicle>> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
}

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
import { DataContext, IDbRecord } from '@agrejus/db-framework';
import { PouchDbPlugin } from '@agrejus/db-framework-plugin-pouchdb';

export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

export interface IVehicle extends IDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

export class MyDataContext extends DataContext<MyDocumentTypes, IDbRecord<MyDocumentTypes.Vehicle>> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
}

const context = new MyDataContext();

const chevy2021Vehicles = await context.vehicles.filter(w => w.year === 2021 && w.make === "Chevrolet");

```

### Change Tracking <a name = "query_data"></a>
Db Framework offers two different types of change tracking: Entity and Context.  Change tracking is an important part of Db Framework as it allows the framework to detect changes and only save data that has changed vs over saving.  Another advantage of change tracking is the ability to split out add/update/delete actions for use in underlying data stores.

- Entity Change Tracking
  - Uses [Proxy object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to detect changes in the entity to determine if it has changed.  This form of change tracking is great, because changes are tracked at the entity level, independent of the context.  
    - Pros:
      - Entities can be passed between contexts and changes are retained
    - Cons:
      - Proxy objects can be a pain to deal with, especially serializing then across boundaries (WebWorkers)


- Context Change Tracking
  - Uses [object hashing]() to track changes in entities.  Changes are stored at the context level, not the entity.  If an entity is passed from one context to another via [linking](), changes are lost and the object needs to be [marked dirty]() to recognize changes have been made.  This form of change tracking is great because all objects are plain old JavaScript objects that can be easily serialized.
    - Pros:
      - Entities are plain JavaScript objects
    - Cons:
      - Changes are lost when entites are linked between contexts
      - Saving/Selecting a lot of data can be slow











## Database Plugins <a name = "database_plugins"></a>
DB Framework can work with a variety of different data stores through the use of database plugins.  The database plugin is the way DB Framework interacts with the database.  These plugins can be swapped out for different ones, or custom ones can be created.  For ease of use, there are 3 existing plugins that can be used below.

### Memory Plugin <a name = "data_context_save_changes"></a>
Saves all underlying changes to the data store.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.

**Package:** [@agrejus/db-framework-plugin-memory](https://www.npmjs.com/package/@agrejus/db-framework-plugin-memory)

### PouchDB Plugin <a name = "data_context_save_changes"></a>
Saves all underlying changes to the data store.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.

**Package:** [@agrejus/db-framework-plugin-pouchdb](https://www.npmjs.com/package/@agrejus/db-framework-plugin-pouchdb)

### Local Storage Plugin <a name = "data_context_save_changes"></a>
Saves all underlying changes to the data store.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.

**Package:** [@agrejus/db-framework-plugin-local-storage](https://www.npmjs.com/package/@agrejus/db-framework-plugin-local-storage)





## DataContext <a name = "data_context"></a>
A data context is meant to be the orchestrator of all dbsets and manage their operations.  Memory (changes) is not shared across dbsets, meaning, if an entity is being tracked by one data context, other data context's do not know about it.  We can fix that by [linking]() and [unlinking]() entities from one context to another.  When an entity is unlinked from from a dbset, changes are not lost with [entity change tracking](), but are lost with [context change tracking]().  One way to combat the loss of change tracking with context change tracking is to link the entity and [mark it dirty]() afterwards.  

The data context is meant to be light, with all of the heavy lifting done in the db sets.  

### `.saveChanges` <a name = "data_context_save_changes"></a>
Saves all underlying changes to the data store.  Must be called, otherwise no changes will be saved.  Returns count of entities saved.

**Type:** `.saveChanges(): Promise<number>`

**Usage:**
```typescript
import { DataContext, IDbRecord } from '@agrejus/db-framework';
import { PouchDbPlugin } from '@agrejus/db-framework-plugin-pouchdb';

export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

export interface IVehicle extends IDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

export class MyDataContext extends DataContext<MyDocumentTypes, IDbRecord<MyDocumentTypes.Vehicle>> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
}

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


### `.getAllDocs` <a name = "get_all_docs"></a>
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

### `.previewChanges` <a name = "data_context_preview_changes"></a>
Returns an object of adds/updates/removes to be persisted to the database.

NOTE: Items returned are a copy of the original, so changes made to these entities will not be saved to the database.

**Type:** `.previewChanges(): Promise<IPreviewChanges<TDocumentType, TEntityBase>>`

### `.empty` <a name = "data_context_empty"></a>
Empties all objects in the database.  Save changes must be called to actually empty all items from the database.

**Type:** `.empty(): Promise<void>`

### `.destroyDatabase` <a name = "data_context_destroy_database"></a>
Destroys the underlying database, save changes does not need to be called

**Type:** `.destroyDatabase(): Promise<void>`

### `.getDbSet` <a name = "data_context_get_db_set"></a>
Get a db set for the matching document type

**Type:** `.getDbSet(documentType: TDocumentType): IDbSet<string, any, never>`

### protected `.onBeforeSaveChanges` <a name = "data_context_on_before_save_changes"></a>
Function that is called before changes are persisted to the underlying data store.  Entites returned are a reference, meaning, if an entity is changed, that change will make it into the database.  This function has an argument that is a function to help with performance.  The argument `getChanges` must be called to get all changes an any entity tags.  This function can be used for a variety of things.  Most commonly, it is used for history tracking and evaluating entity tags.

**Type:** `.onBeforeSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>):Promise<void>`

### protected `.onAfterSaveChanges` <a name = "data_context_on_after_save_changes"></a>
Function that is called after changes are persisted to the underlying data store.  Entites returned are a copy not a reference, meaning any changes will be thrown away and not saved to the data base.  This function has an argument that is a function to help with performance.  The argument `getChanges` must be called to get all changes an any entity tags.  This function is also commonly used for history tracking and evaluating entity tags.

**Type:** `.onAfterSaveChanges(getChanges: () => SaveChangesEventData<TDocumentType, TEntityBase>):Promise<void>`

### protected `.onSaveError` <a name = "data_context_on_save_error"></a>
Function that is called when there is an error saving data.

**Type:** `.onSaveError(error: any):Promise<void>`


## StatefulDataContext <a name = "stateful_data_context"></a>
A stateful data context is meant to keep data store information in sync between memory and the underlying data base.  This can be done with [on before save changes](#data_context_on_before_save_changes) and [on after save changes](#data_context_on_after_save_changes) manually, or DB Framework can manage it for you.  Often times, apps will use a state management middleware, this middleware needs to be kept in sync with the database in some way.  The previously mention functions can be used with existing middleware or this data context can be used.  A [React hook](#react_state_hook) can even be created for ease of use.

### `.addChangeEventListener` <a name = "add_change_event_listener"></a>
Function to add change events that are fired when data is added, removed, updated.  Returns an unregister function, when called, unregisters the event handler. Change events do not need to be re-registered when a context is destroyed, these change events are registered globally.

**Type:** `.addChangeEventListener(documentType: TDocumentType, callback: ChangeHandler): () => void`

### `.removeAllEventListeners` <a name = "remove_all_event_listeners"></a>
Will unregister all event listeners.
**Type:** `.removeAllEventListeners(): void`

### `.hydrate` <a name = "stateful_data_context_hydrate"></a>
Populates all DbSet states with existing data from the database.  Must be called every time a new Data Context is created.
**Type:** `.hydrate(): Promise<void>`

### `.state` <a name = "stateful_data_context_state"></a>
In memory 
**Type:** `get state(): IDataContextState<TDocumentType, TEntityBase>`









## Default DbSet <a name = "default_dbset"></a>

### `.types` <a name = "dbset_types"></a>
Types are exposed from a dbset, because in TypeScript, types are not known until db sets are declared.  Once a dbset is declared, we know the types and can expose the types for other usages in the application.

**Type:** `.get types(): { modify: OmittedEntity<TEntity, TExclusions>, result: TEntity, documentType: TEntity["DocumentType"], map: { [DocumentType in TEntity["DocumentType"]]: TEntity }, dbsetType: DbSetType }>`

### `.info` <a name = "dbset_info"></a>
Info is used to information about the dbset, such as it's defaults, keys, readonly status and more.  Please check out the [IDbSetInfo](#dbset_info_type) for all information returned from info.

**Type:** `.info(): IDbSetInfo<TDocumentType, TEntity, TExclusions>`

### `.tag` <a name = "dbset_tag"></a>
Tagging allows for developers to tag entities with meta data that can be read in [onBeforeSaveChanges](#data_context_on_before_save_changes) or onAfterSaveChanges.  One use case for tagging is to tag certain data when it's removed to distinguish between a user clicking to remove data or the application automatically removing data on it's own.  We can add a tag to the code behind the click operation and consume the tag in onBeforeSaveChanges or onAfterSaveChanges to do something with it.

**Type:** `.tag(value: unknown): this`

### `.instance` <a name = "dbset_instance"></a>
Instance will create an untracked instance of an entity as if it were actually added to change tracking and queued for saving to the database.  One use case for instace is to use it for ID creation.

**Type:** `.instance(...entities: OmittedEntity<TEntity, TExclusions>[]): TEntity[]`

### `.add` <a name = "dbset_add"></a>

**Type:** `.add(...entities: OmittedEntity<TEntity, TExclusions>[]): Promise<TEntity[]>`

### `.upsert` <a name = "dbset_upsert"></a>

**Type:** `.upsert(...entities: (OmittedEntity<TEntity, TExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>`

### `.remove` <a name = "dbset_remove"></a>

**Type:** `.remove(...ids: string[]): Promise<void>`
**Type:** `.remove(...entities: TEntity[]): Promise<void>`

### `.empty` <a name = "dbset_empty"></a>

**Type:** `.empty(): Promise<void>`

### `.all` <a name = "dbset_all"></a>

**Type:** `.all(): Promise<TEntity[]>`

### `.filter` <a name = "dbset_filter"></a>

**Type:** `.filter(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity[]>`

### `.isMatch` <a name = "dbset_is_match"></a>

**Type:** `.isMatch(first: TEntity, second: any): boolean`

### `.match` <a name = "dbset_match"></a>

**Type:** `.match(...items: IDbRecordBase[]): TEntity[]`

### `.get` <a name = "dbset_get"></a>

**Type:** `.get(...ids: string[]): Promise<TEntity[]>`

### `.find` <a name = "dbset_find"></a>

**Type:** `.find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined>`

### `.unlink` <a name = "dbset_unlink"></a>

**Type:** `.unlink(...entities: TEntity[]): void`

### `.markDirty` <a name = "dbset_mark_dirty"></a>

**Type:** `.markDirty(...entities: TEntity[]): Promise<TEntity[]>`

### `.link` <a name = "dbset_link"></a>

**Type:** `.link(...entities: TEntity[]): Promise<TEntity[]>`

### `.first` <a name = "dbset_first"></a>

**Type:** `.first(): Promise<TEntity>`










## Default DbSet Builder <a name = "default_dbset_builder"></a>








## Stateful DbSet <a name = "store_dbset"></a>





## Stateful DbSet Builder <a name = "default_dbset_builder"></a>








## Authors <a name = "authors"></a>
- [@agrejus](https://github.com/agrejus)

## Supporting Type Declarations

### `.IDbSetInfo` <a name = "dbset_info_type"></a>
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

See also the list of [contributors](https://github.com/kylelobo/The-Documentation-Compendium/contributors) who participated in this project.