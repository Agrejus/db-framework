import { IDbRecord } from '../src/types/entity-types';
import { DataContext } from '../src/context/DataContext';
import { PouchDbPlugin } from '@agrejus/db-framework-plugin-pouchdb';

export enum MyDocumentTypes {
    Vehicle = "Vehicle"
}

export interface IVehicle extends IDbRecord<MyDocumentTypes.Vehicle> {
    make: string;
    model: string;
    year: number;
    color: string;
    trim: string;
}

export class MyDataContext extends DataContext<MyDocumentTypes, IDbRecord<MyDocumentTypes.Vehicle>> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    vehicles = this.dbset().default<IVehicle>(MyDocumentTypes.Vehicle).create();
}

const context = new MyDataContext();

// Basic example/Create data
await context.vehicles.add({
    color: "Silver",
    make: "Chevrolet",
    model: "Silverado",
    trim: "RST",
    year: 2021
});

await context.saveChanges();

// Updating data
// const found = await context.vehicles.find(w => w.year === 2021);

// if (found != null) {
//     found.trim = "some different trim"
// }

// await context.saveChanges();

// query
const found = await context.cars.find(w => w.year === 2021);

if (found != null) {
    await context.cars.remove(found)
}

await context.saveChanges();