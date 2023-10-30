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

<p align="center"> Database agnostic ORM for NodeJS and the web
    <br> 
</p>

## Table of Contents
- [About](#about)
- [Getting Started](#getting_started)
  - [Installation](#installation)
  - [Basic Usage](#basic_usage_example)
- [Change Log](./changelog.md)
- [Authors](#authors)

## About <a name = "about"></a>
Db Framework is a TypeScript first ORM desiged to wrap existing database frameworks such as PouchDB to augment its functionality.  Db Framework aims to take the headaches out of other ORMs and provide repeatable processes for CRUD operations with minimal code.  Inspired by .NET's Entity Framework, Db Framework operates the same way and tries to keep method names as close as possible.

Db Framework provides a ton of flexibility, even going as far as offering a local state store (think Redux).

Why it's great:
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


## Database Plugins <a name = "database_plugins"></a>

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
Get a db set for the matching document type

**Type:** `.getDbSet(documentType: TDocumentType): IDbSet<string, any, never>`

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

## Store DbSet <a name = "store_dbset"></a>

## Store DbSet Builder <a name = "default_dbset_builder"></a>

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