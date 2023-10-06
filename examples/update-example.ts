import { IDbRecord } from '../src/types/entity-types';
import { DataContext } from '../src/context/DataContext';
import { PouchDbPlugin } from '@agrejus/db-framework-plugin-pouchdb';

// Declare document types
export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

// Declare models
export interface IVehicle extends IDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

// Create Data context using a provider
export class MyDataContext extends DataContext<MyDocumentTypes, IDbRecord<MyDocumentTypes.Vehicle>> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicle = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
}

const context = new MyDataContext();

const found = await context.vehicle.find(w => w.year === 2021);

if (found != null) {
    found.trim = "some different trim"
}

await context.saveChanges();

