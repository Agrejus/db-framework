# All

**Definition**
```typescript
.all(): Promise<TEntity[]>
```

**Overview**

A data context has a function called `.all()` to retrieve all documents in the data store.  This will retrieve all documents, even ones that were not created by the data context.  Changes can be made to the entities returned, just like documents from a dbset, and those changes can be saved.

```typescript
import { DataContext } from '@agrejus/db-framework';
import { PouchDbPlugin, PouchDbRecord } from '@agrejus/db-framework-plugin-pouchdb';

// Declare document types
export enum MyDocumentTypes {
    Vehicle = "Vehicle",
    Books = "Books"
}

// Declare models
export interface IVehicle extends PouchDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

export interface IBook extends PouchDbRecord<MyDocumentTypes.Vehicle> {
    author: string;
    illustrator: string;
    year: number;
    publishedDate: Date;
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
    books = this.dbset().default<IBook>(MyDocumentTypes.Books).create();
}

const context = new MyDataContext();

const allVehiclesAndBooks = await context.all();
```