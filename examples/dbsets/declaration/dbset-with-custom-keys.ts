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

export class MyDataContext extends DataContext<MyDocumentTypes, PouchDbRecord<MyDocumentTypes>, "_id" | "_rev"> {

    constructor() {
        super({ dbName: "some-new-database" }, PouchDbPlugin)
    }

    contextId() {
        return MyDataContext.name;
    }

    // the final id will be "{DocumentType}/{year}/{make}"
    carsWithYearAndMakeAsKey = this.dbset().default<ICar>(MyDocumentTypes.Cars).keys(w => w.add("year").add("make")).create();

    // the final id will be "{DocumentType}/{uuid}"
    carsWithRandomUIID = this.dbset().default<ICar>(MyDocumentTypes.Cars).keys(w => w.auto()).create();

    // the final id will be "{DocumentType}".  This is useful when there will only ever be one document for the document type.  Example - Configuration
    carsWithOnlyOneDocument = this.dbset().default<ICar>(MyDocumentTypes.Cars).keys(w => w.none()).create();

    // the final id will be "{DocumentType}/{make}-{year}"
    carsWithCustomKey = this.dbset().default<ICar>(MyDocumentTypes.Cars).keys(w => w.custom(x => `${x.make}-${x.year}`)).create();
}