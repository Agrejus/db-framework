# Interface/Type Schema

Schemas are the primary way DB Framework can provide types based on a dbset.  Without schemas, DB Framrwork does not know the shape of the entity it is operating on.  A schema can be an interface or type.

When defining a schema, it must extend the base entity that the database plugin expects.  For example, the `@agrejus/db-framework-plugin-pouchdb` uses `PouchDbRecord` as it's base entity.  All schemas must extend `PouchDbRecord` to ensure they have the correct base properties of `_id` and `_rev` since those are required by PouchDB.

Schemas can have any number of properties or nested properties.  Nested objects and arrays work out of the box.  It should be noted that nested arrays do impact performance on large datasets.

Below is an example of creating a new PouchDB schema.  You will notice we have `MyDocumentTypes` declared as well.  We need the exact document type so DB Framework can infer on dbset creation and return the correct types in all queries.

**Correct:**
```typescript
export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

export interface IVehicle extends PouchDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}
// OR
export type IVehicle = PouchDbRecord<MyDocumentTypes.Vehicle> & {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}
```

**Wrong:**
```typescript
export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

// we need the exact document, not the enum itself
export interface IVehicle extends PouchDbRecord<MyDocumentTypes> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}
```