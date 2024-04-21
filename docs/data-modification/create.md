# Create

**Definition**
```typescript
.add(...entities: OmittedEntity<TEntity, TExclusions>[]): Promise<TEntity[]>;
.upsert(...entities: (OmittedEntity<TEntity, TExclusions> | Omit<TEntity, "DocumentType">)[]): Promise<TEntity[]>;
```

**Overview**

Creating data with DB Framework is very easy, simply call `.add()` on a dbset and then call `.saveChanges()` on the data context to persist the changes.  Data can also be created with the `.upsert()` function call, but it is slower than `.add()`, because it needs to check to see if an entity exists.  If an entity already exists, the incoming entity will be merged with the existing entity and those changes will be saved when `.saveChanges()` is called.  Both `.add()` and `.upsert()` can take in one or many entities and return an array of the added (not saved) entity.

<u>NOTE: </u> Save changes does not modify the added entity by reference.  If the result is needed, please use the `.match()` function to select the resulting document.

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

const [myAddedDocument] = await context.vehicles.add({
    make: "Chevrolet",
    model: "Silverado",
    year: 2021,
    color: "gray",
    trim: "RST"
});

const result = await context.saveChanges();

const doc = result.adds.match(myAddedDocument);
```

### Upsert

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

const [myAddedDocument] = await context.vehicles.upsert({
    make: "Chevrolet",
    model: "Silverado",
    year: 2021,
    color: "gray",
    trim: "RST"
});

const result = await context.saveChanges();

const doc = result.adds.match(myAddedDocument);
```