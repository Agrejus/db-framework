# Custom Change Tracking

Custom change tracking is another method of change tracking for DB Framework.  This method of change tracking allows developers to provide their own algorithm to compare objects and check for changes.  To provide a custom change tracking algorithm, use `.getChanges()` when declaring the dbset as shown below.

This method of change tracking does not use Proxy objects, just plain JavaScript objects.  One caveat of using custom change tracking vs entity change tracking is changes are tracked at the context level.  Meaning, if we try to `.link()` an entity to another context, all changes will be lost.  We can get around this by marking the entity as dirty by calling `markDirty()`.

In the below example, we are only tracking changes for the `year` property.  This means if any other properites change, db framework will not see the changes and they will not be saved.  However, if `year` changes and other properties change, those properties will be potentially be saved depending on the db plugin being used.

`@agrejus/db-framework-plugin-pouchdb` - Will save changed properties an untracked ones if a tracked property is changed
`@agrejus/db-framework-plugin-memory` - Will save changed properties an untracked ones if a tracked property is changed
`@agrejus/db-framework-plugin-localstorage` - Will save changed properties an untracked ones if a tracked property is changed

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

    vehicles = this.dbset()
        .default<IVehicle>(MyDocumentTypes.Vehicle)
        .getChanges((original, next) => {
            const changes: { [key: string | number]: any } = {};

            // we are only going to track changes for the year property
            if (original.year !== next.year) {
                changes.year = next.year;
            }

            // Do not return an empty object if there are no changes, return null instead
            return Object.keys(changes).length > 0 ? changes : null;
        })
        .create();
}
```