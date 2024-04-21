# Delete

**Definition**
```typescript
remove(...ids: string[]): Promise<void>;
remove(...entities: TEntity[]): Promise<void>;
```

**Overview**

Deleting data with DB Framework is very easy, simply call `.remove()` on a dbset and then call `.saveChanges()` on the data context to persist the changes.  The function can be called with an entire entity or just the ids of the entities.

### Add

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

const found = await context.vehicles.find(w => w.year === 2021 && w.make === "Chevrolet");

if (found != null)

await context.vehicles.remove(found);

const result = await context.saveChanges();
```