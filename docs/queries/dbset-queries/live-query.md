# Live Query

**Definition**
```typescript
subscribe(
    callback: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>
): () => void;
subscribe(
    selector: EntitySelector<TDocumentType, TEntity>, 
    callback: DbSetSubscriptionCallback<TDocumentType, TEntity, TExclusions>
): () => void;
```

**Overview**

Each dbset has a function called `.subscribe()` that can be used to enable live querying and subscribe to all changes, or just the changes that match the query.  Subscriptions work across data difference instances of the same data context, subscribe one time and it will be called if there are changes.  Be sure to unsubscribe to prevent memory leaks in the application.

### Setup
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
```

### Subscribe to all changes
```typescript
const context = new MyDataContext();
const unsubscribe = await context.vehicles.subscribe((adds, updates, removes) => {
    // I have changes
});
```

### Live Query
```typescript
const context = new MyDataContext();
const unsubscribe = await context.vehicles.subscribe(w => w.year === 2021, (adds, updates, removes) => {
    // I have changes
});
```