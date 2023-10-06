import { IDbRecord } from '../src/types/entity-types';
import { DataContext } from '../src/context/DataContext';
import { PouchDbPlugin } from '@agrejus/db-framework-plugin-pouchdb';

// Declare document types
export enum MyDocumentTypes {
    Cars = "Cars"
}

// Declare models
export interface ICar extends IDbRecord<MyDocumentTypes.Cars> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

// Create Data context using a provider
export class MyDataContext extends DataContext<MyDocumentTypes, IDbRecord<MyDocumentTypes.Cars>> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    cars = this.dbset().default<ICar>(MyDocumentTypes.Cars).create();
}

const context = new MyDataContext();

const found = await context.cars.find(w => w.year === 2021);

if (found != null) {
    await context.cars.remove(found)
}

await context.saveChanges();

