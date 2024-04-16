# Pluck
**Definition**
```typescript
.pluck<TKey extends keyof TEntity>(
    selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean, 
    propertySelector: TKey
): Promise<TEntity[TKey]>
```

**Overview**

Each dbset has a function to pluck a property off of a found document. This is merely a shortcut method instead of calling find and returning the property off of the entity if it exists.  If an entity is not found, an error will be throw because there is nothing to pluck from.

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

const model = await context.vehicles.pluck(w => w.year === 2021 && w.make === "Honda" && w.color === "Black", "model");
```