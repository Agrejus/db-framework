# Cached Query

**Definition**
```typescript
.useCache(
    configuration: { key: string; } | { key: string; ttl: number; }
): this
```

**Overview**

Each dbset has a .  As the name suggests, `filter()` operates the same way as filtering an array in JavaScript, found data will be returned in the array.  If no data is found, an empty array will be returned.  This function only returns documents in the corresponding dbset, no documents from other dbsets or other data in general.  Its usage is very straight forward, simply call `.filter()` on the dbset.  See below for a full example.  After data is selected, it can be modified and saved by calling `saveChanges()`.

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

const all2021Vehicles = await context.vehicles.filter(w => w.year === 2021);
const all2021And2022Vehicles = await context.vehicles.filter(w => w.year === 2021 || w.year === 2022);
const all2021HondaVehicles = await context.vehicles.filter(w => w.year === 2021 && w.make === "Honda");
```


const found = await context.contacts.useCache({ key: "test", ttl: 10 }).find(w => w.firstName === "James");
