# Local Storage Database Plugin

The local storage database plugin stores all data operations in [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).  This plugin can be used only in Web applications.

## Installation
`npm i @agrejus/db-framework-plugin-localstorage`

## Usage
To use the memory plugin, `LocalStorageDbPlugin` must be passed into the `super()` call of the new database constructor as shown below.

```typescript
import { DataContext } from '@agrejus/db-framework';
import { LocalStorageDbPlugin, LocalStorageDbRecord } from '@agrejus/db-framework-plugin-localstorage';

// Declare document types
export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

// Declare models
export interface IVehicle extends LocalStorageDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

// Create Data context using a provider
export class MyDataContext extends DataContext<MyDocumentTypes, LocalStorageDbRecord<MyDocumentTypes>, "id" | "rev"> {

    contextId() {
        return MyDataContext.name;
    }

    constructor() {
        super({ dbName: "some-new-database" }, LocalStorageDbPlugin)
    }
}
```