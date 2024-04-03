import { DataContext } from '../../../src/context/DataContext';
import { PouchDbPlugin, PouchDbRecord } from '@agrejus/db-framework-plugin-pouchdb';

// Declare document types
export enum MyDocumentTypes {
    Cars = "Cars"
}

// Declare models
export interface ICar extends PouchDbRecord<MyDocumentTypes.Cars> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

export class MyDataContextWithReadonly extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    contextId() {
        return MyDataContextWithReadonly.name;
    }

    cars = this.dbset().default<ICar>(MyDocumentTypes.Cars).readonly().create();
}