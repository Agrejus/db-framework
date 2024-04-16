# All

**Definition**
```typescript
.all(): Promise<TEntity[]>
```

**Overview**

Each dbset has a function to get all documents.  This function only returns documents in the corresponding dbset, no documents from other dbsets or other data in general.  Its usage is very straight forward, simply call `.all()` on the dbset.  See below for a full example.  After data is selected, it can be modified and saved by calling `saveChanges()`.

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

const allVehicles = await context.vehicles.all();
```