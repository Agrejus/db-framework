# Memory Database Plugin

The memory database plugin stores all data operations in memory.  This plugin can be used in both Web and NodeJS applications.

## Installation
`npm i @agrejus/db-framework-plugin-memory`

## Usage
To use the memory plugin, `MemoryDbPlugin` must be passed into the `super()` call of the new database constructor as shown below.

```typescript
import { DataContext } from '@agrejus/db-framework';
import { MemoryDbPlugin, MemoryDbRecord } from '@agrejus/db-framework-plugin-memory';

// Declare document types
export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

// Declare models
export interface IVehicle extends MemoryDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

// Create Data context using a provider
export class MyDataContext extends DataContext<MyDocumentTypes, MemoryDbRecord<MyDocumentTypes>, "id" | "rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, MemoryDbPlugin)
    }
}
```