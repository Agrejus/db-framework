# Cached Query

**Definition**
```typescript
.useCache(
    configuration: { key: string; } | { key: string; ttl: number; }
): this
```

**Overview**

Each dbset has a fluent function called `.useCache()` that can be used in front of any query call to cache that query result.  A fluent function means the function call returns itself.  After `.useCache()` is called, a query function must be called, such as `.filter()`.  In this example, the result of the filter call will be cached and returned when the function with a matching cache key is called again.

<u>NOTE:</u>  Caching is done off of the cache key, not the function signature.  Meaning, if `.useCache()` is called in two different spots with the same cache key and different functions or query operations are called and we have a cached value, the cached value will be return which may not match the intented.

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
