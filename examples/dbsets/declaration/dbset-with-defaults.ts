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

    // add defaults give us the ability to set defaults only when an entity is added.  This is most often coupled with .exclude() to exclude properties from being added and have a default value for them instead.
    // For example, if only want to add Tesla vehicles to the database, we can set the default value to "Tesla" and exclude the make property from being added
    carsWithAddDefault = this.dbset().default<ICar>(MyDocumentTypes.Cars).defaults({ add: { make: "Tesla" } }).exclude("make").create();

    // retrieve defaults give us the ability to set defaults only when an entity is retrieved.  This is useful when we want to add a nullable property and have it defaulted to a value. 
    // we can set the default value when it is retrieved, then on save it will be persisted
    carsWithRetrieveDefault = this.dbset().default<ICar>(MyDocumentTypes.Cars).defaults({ retrieve: { model: "Model S" } }).create();

    // retrieve defaults give us the ability to set defaults only when an entity is retrieved.  This is useful when we want to add a nullable property and have it defaulted to a value. 
    // we can set the default value when it is retrieved, then on save it will be persisted
    carsWithBothAddAndRetrieveDefault = this.dbset().default<ICar>(MyDocumentTypes.Cars).defaults({ model: "Model S" }).create();
}

// add with default and exclude example
const context = new MyDataContext();

// notice how make is omitted
const [ car ] = await context.carsWithAddDefault.add({
    model: "Model S",
    year: 2023,
    color: "white",
    trim: "P100D"
});