# Profiling

DB Frameworks profiler feature is great to gain insight into what functions are being called with what data.  Often times with external libraries, we send data into a black box and things just happen.  The profiler is an attempt to peel back the curtains inside of DB Framework, allowing developers to see exactly what is happening.  The profiler can be enabled with performance monitoring to get the arguments each functions was called with, but beware, enabling the profiler with performance monitoring will impact the results.  All performance monitoring will be slower, because arguments need to be stringified then logged.  To get around this please provide your own custom logger and do not stringify the arguments.

Profiler monitoring Options:
```typescript
{
    enabled: boolean; // boolean flag to enable or disable
    only?: string[]; // function names to be logged, any names not matching the list will not be logged
}
```

**Example**

If we only want to profile the `_bulkModifications` call, where DB Framework calls the database plugin, we can use the below configuration.  This will log out the function call along with the arguments it was called with.
```typescript
{
    enabled: true,
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
      profiler: { enabled: true },
      // optional logger
      logger: (data) => {
        // your custom logging here
      },
    });
  }
}
```