# Readonly Change Tracking

Readonly change tracking is another method of change tracking for DB Framework.  As the name suggests, all entities are readonly and no changes are tracked ever.  No changes can be made to the entity, if they are someone coerced, they will never be saved.  To enable readonly change tracking, use `.readonly()` when declaring the dbset as shown below.

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

    // By adding .readonly(), vehicles will now be readonly
    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).readonly().create();
}
```