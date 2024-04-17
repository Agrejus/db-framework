# Custom Queries

**Overview**

Dbsets have the ability to add custom functionality to create your own custom query methods if the existing ones do not satisfy your needs.  Below is an example of adding a custom `.query()` function to a dbset.  All documents returned can be modified and saved just like results from other query functions

### Step 1

Ensure the db plugin being used has the correct functionality exposed.  In this case, we are using the `@agrejus/db-framework-plugin-pouchdb`, which has a `.query()` [function exposed](https://github.com/Agrejus/db-framework/blob/4c1c85ac64089d1f34f97fc40900639bd5e8ed56/plugins/pouchdb/src/PouchDbPlugin.ts#L78).  

### Step 2

Create a dbset and add a custom create function to add functionality

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
        .create((Instance, props) => new class extends Instance {
            constructor() {
                super(props);

                // skip if you do not wish to use performance monitoring or profiling
                this.registerMonitoringMixin(this, 'query');
            }
        });
}
```

### Step 3

Add a custom class function to the anonymous class we are sending into the create function call.  Below, we are adding `.query()`

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
        .create((Instance, props) => new class extends Instance {
            constructor() {
                super(props);

                // skip if you do not wish to use performance monitoring or profiling
                this.registerMonitoringMixin(this, 'query');
            }

            async query(request: PouchDB.Find.FindRequest<FeatureRecord>) {
                // only allow to query vehicles

                if (request.selector.DocumentType !== MyDocumentTypes.Vehicle) {
                    request.selector.DocumentType = MyDocumentTypes.Vehicle;
                }

                // Here is the call to the db plugin function
                const result = await this.dbPlugin.query(request);

                // Create enrichment function to ensure all functionality declared on the dbset is run properly
                const enrich = this.changeTracker.enrichment.compose('deserialize', 'defaultRetrieve', 'changeTracking', 'enhance');

                // Ensure we return the type as shown below.  We do this in case we are using enhancers
                const docs = result.docs as (typeof this.types.result)[];

                // Run the enrichment functions
                const enriched = docs.map(enrich);

                // Attach the resulting documents to the change tracker
                return this.changeTracker.attach(...enriched);
            }
        });
}
```