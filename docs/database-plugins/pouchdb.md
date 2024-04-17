# PouchDB Database Plugin

The [PouchDB](https://pouchdb.com/) database plugin is the communication layer for PouchDB.  PouchDB will use IndexedDB for all web applications and LevelDB for all NodeJS applications.

## Installation
`npm i @agrejus/db-framework-plugin-pouchdb`

## Usage
To use the PouchDB plugin, `PouchDbPlugin` must be passed into the `super()` call of the new database constructor as shown below.

```typescript
import { DataContext } from '@agrejus/db-framework';
import { PouchDbPlugin, PouchDbRecord } from '@agrejus/db-framework-plugin-pouchdb';

// Declare document types
export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

// Declare models
export interface IVehicle extends PouchDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

// Create Data context using a provider
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }
}
```