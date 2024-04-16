# Find

**Definition**
```typescript
.find(
    selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean
): Promise<TEntity | undefined>
```

**Overview**

Each dbset has a function to get filter documents.  As the name suggests, `find()` operates the same way as calling `.find()` on an array in JavaScript, found data will be returned as a singular object.  If no data is found, undefined will be returned.  This function only returns a document in the corresponding dbset, no documents from other dbsets or other data in general.  Its usage is very straight forward, simply call `.find()` on the dbset.  See below for a full example.  After data is selected, it can be modified and saved by calling `saveChanges()`.


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

const found = await context.vehicles.find(w => w.year === 2021 && w.make === "Honda" && w.color === "Black");
```