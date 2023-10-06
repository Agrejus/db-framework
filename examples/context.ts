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