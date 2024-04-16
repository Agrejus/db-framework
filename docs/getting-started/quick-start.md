# Quick Start
It is very easy to get started with DB Framework.  First, create an enum or union type of all your document types.  Second, [declare your model](getting-started/models).  Last, create a data context by inheriting from `DataContext`.

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

Once we have defined our models and data context, we can now use it

```typescript
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

When `saveChanges()` is called, any data that was modified will be persisteed to the underlying data store.  In this example, we are adding one vehicle to the underlying data store.