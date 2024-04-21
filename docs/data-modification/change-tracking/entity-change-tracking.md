# Entity Change Tracking

Entity change tracking is the default method of change tracking for DB Framework.  It works by way of using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) objects and setting changes on the object when changes are made.  If a change is made, and the value is later changed to the original value, this will count as no change made.  

Since changes are tracked on the entity itself, they can be trasferred between contexts if needed and changes will not be lost.  

Coming in version `1.2.0` is nested change tracking.  This means any child objects on an entity will have change tracking enabled.  `1.2.0` will even track changes to nested arrays, however, it will not track changes to objects in the nested array.  This would be a very slow operation to check `n` entities in an array for potentially many entites.  A better option is to change the array itself.  Later versions will enable nested array change tracking, with the caveat that it will be a slow operation.

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

    // By default, this will use Entity Change Tracking
    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
}
```