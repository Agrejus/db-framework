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

### `.saveChanges` <a name = "save_changes"></a>
Saves all underlying changes to the data store.  Must be called, otherwise no changes will be saved


**Type:** `.saveChanges(): Promise<number>`

**Returns:** Count of entities saved

### `.getAllDocs` <a name = "get_all_docs"></a>
Returns all documents from the data store

**Type:** `.getAllDocs(): Promise<TEntityBase[]>`

**Returns:** All documents in the database

### `.hasPendingChanges` <a name = "has_pending_changes"></a>
Returns boolean flag of whether or not the context has any pending changes

**Type:** `.hasPendingChanges(): boolean`

**Returns:** Boolean flag of whether or not the context has any pending changes

## Authors <a name = "authors"></a>
- [@agrejus](https://github.com/agrejus)

See also the list of [contributors](https://github.com/kylelobo/The-Documentation-Compendium/contributors) who participated in this project.