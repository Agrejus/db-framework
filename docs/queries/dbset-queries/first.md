# First

**Definition**
```typescript
.first(): Promise<TEntity>
```

**Overview**

First returns the first object in a dbset or undefined if nothing is found.  This function is generally used with a dbset that has only one document ever.  Its usage is very straight forward, simply call `.first()` on the dbset.  See below for a full example.  After data is selected, it can be modified and saved by calling `saveChanges()`.


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

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
}

const context = new MyDataContext();

const first = await context.vehicles.first();
```

As mentioned above, first is typically used with a dbset that only ever has 1 or 0 documents.  Below is a more advanced example of a dbset that only allows 1 or 0 documents in it by setting the key of the dbset to none `.keys(w => w.none())`.  When doing this, the key becomes the document type or `_id: SomeConfiguration`.  Typical usage for a dbset like this is configurations.

```typescript
import { DataContext } from '@agrejus/db-framework';
import { PouchDbPlugin, PouchDbRecord } from '@agrejus/db-framework-plugin-pouchdb';

// Declare document types
export enum MyDocumentTypes {
    SomeConfiguration = "SomeConfiguration"
}

// Declare models
export interface ISomeConfiguration extends PouchDbRecord<MyDocumentTypes.SomeConfiguration> {
    testPropertyOne: string;
    testPropertyTwo: string;
    testPropertyThree: string;
}

// Create Data context using a provider
export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    someConfiguration = this.dbset().default<ISomeConfiguration>(MyDocumentTypes.SomeConfiguration).keys(w => w.none()).create();
}

const context = new MyDataContext();

const config = await context.someConfiguration.first();
```