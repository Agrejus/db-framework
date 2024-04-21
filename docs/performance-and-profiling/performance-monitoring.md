# Performance Monitoring

DB Frameworks performance monitoring feature is great to gain insight into the performance of your data store and DB Framework itself.  DB Framework aims to be as fast as possible, while providing the most flexibity to developers.  The default logger will not log the arguments each function was called with, please provide your own logger or enable the [profiler](performance-and-profiling/profiling).  Keep in mind, logging (and stringifying) the arguments will impact overall performance monitoring, that is why by default, arguments are not logged or stringified.  

Performance monitoring Options:
```typescript
{
    enabled: boolean; // boolean flag to enable or disable
    threshold?: number; // threshold in milliseconds to trigger the logger.  If the delta argument is greater than or equal to the threshold, the logger will be triggered
    only?: string[]; // function names to be logged, any names not matching the list will not be logged
}
```

**Example**

If we only want to be notified on long running save operations in the DB Plugin, we can use the below configuration.  It will only log calls to `_bulkModifications` that take 500ms or longer
```typescript
{
    enabled: true,
    threshold: 500,
    only: ["_bulkModifications"]
}
```

Important Functions:
- `_bulkModifications` - DB Plugin operation to save changes to the underlying data store
- `saveChanges` - DB Framework function call to persist any changes to the database.

**Logging**

By default, `console.log` will be used internally by DB Framework.  Developers can provide a custom logger if they wish by providing a logging function along with the profiler configuration.  

<u>NOTE: </u> When using a custom logger, beware of stringifying `args` in the logger function.  You many get an error regarding a circular reference.  If that is the case please use `stringifyCircular` exported by DB Framework `1.2.0`.  That or see the code below

```typescript
const stringifyCircular = (value: any) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (e: any) {
    return JSON.stringify(
      value,
      () => {
        const visited = new WeakSet();
        return (_: any, value: any) => {
          if (typeof value === "object" && value !== null) {
            if (visited.has(value)) {
              return;
            }
            visited.add(value);
          }
          return value;
        };
      },
      2
    );
  }
};
```


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

export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {
  contextId() {
    return MyDataContext.name;
  }

  constructor() {
    super({ dbName: "some-new-database" }, PouchDbPlugin, {
      performance: { enabled: true },
      // optional logger
      logger: (data) => {
        // your custom logging here
      },
    });
  }
}
```