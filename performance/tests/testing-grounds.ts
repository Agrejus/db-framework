
import { DataContext } from "../../src/context/DataContext";
import { IDbRecord } from "../../src/types/entity-types";
import { PouchDbPlugin, PouchDbRecord } from "@agrejus/db-framework-plugin-pouchdb";
import { IDbPluginOptions } from "../../src/types/plugin-types";
import { contextBuilder } from "../../src/context/builder/context-builder";
import { DbSetRemoteChanges } from "../../src/types/dbset-types";
import { StatefulDataContext } from "../../src/context/StatefulDataContext";
import { DbContextFactory, ExternalDataContext } from "../../src/__tests__/integration/shared/context";
import { faker } from "@faker-js/faker";
import PouchDB from 'pouchdb';
import { performance } from "perf_hooks";

enum DocumentTypes {
    Notes = "Notes",
    Contacts = "Contacts",
    Books = "Books",
    Cars = "Cars",
    Preference = "Preference",
    ExtendedBooks = "ExtendedBooks",
    Configuration = "Configuration"
}

interface IChildConfigration {
    someProperty_1: string;
    someArray_1: string[];
}

interface IConfiguration extends PouchDbRecord<DocumentTypes> {
    someProperty_1: string;
    someProperty_2: string;
    someProperty_3: string;
    someProperty_4: string;
    someProperty_5: string;
    someProperty_6: string;
    someProperty_7: string;
    someProperty_8: string;
    someProperty_9: string;
    someProperty_10: string;
    someProperty_11: string;
    someChildObject: IChildConfigration;
}


interface IPreference extends PouchDbRecord<DocumentTypes> {
    someProperty_1: string;
    someProperty_2: string;
    someProperty_3: string;
    someProperty_4: string;
    someProperty_5: string;
    someProperty_6: string;
    someProperty_7: string;
    someProperty_8: string;
    someProperty_9: string;
    someProperty_10: string;
    someProperty_11: string;
}

interface INote extends PouchDbRecord<DocumentTypes> {
    contents: string;
    createdDate: string;
    userId: string;
}

interface IBook extends PouchDbRecord<DocumentTypes> {
    author: string;
    publishDate?: string;
    rejectedCount: number;
    status: "pending" | "approved" | "rejected";
    syncStatus: "pending" | "approved" | "rejected";
    test?: string
}

interface ICar extends PouchDbRecord<DocumentTypes.Cars> {
    make: string;
    model: string;
    year: number;
    manufactureDate: string;
}

const PerformanceDataContext = contextBuilder<DocumentTypes>()
    .useBaseRecord<PouchDbRecord<DocumentTypes>>()
    .useExclusions()
    .usePlugin({ dbName: "performance-db" }, PouchDbPlugin)
    .createDefault((Base) => {
        return class extends Base {

            contextId() {
                return "some-name"
            }

            cars = this.dbset().default<ICar>(DocumentTypes.Cars)
                .keys(w => w.auto())
                .create();

            books = this.dbset().default<IBook>(DocumentTypes.Books)
                .keys(w => w.auto())
                .create();

            notes = this.dbset().default<INote>(DocumentTypes.Notes)
                .keys(w => w.auto())
                .create();

            preferences = this.dbset().default<IPreference>(DocumentTypes.Preference)
                .keys(w => w.auto())
                .create();

            configurations = this.dbset().default<IConfiguration>(DocumentTypes.Configuration)
                .keys(w => w.auto())
                .create();
        }
    });


export const run = async () => {
    try {

        // const context = new ExternalDataContext("test-db");
        // const all = await context.computers.all();
        // console.log(all);
        // debugger;

        // const [contact] = await context.computers.add({
        //     cores: 8,
        //     name: "Some Name"
        // });

        // await context.saveChanges();

        // contact.name = "TEst";
        // debugger;
        // const changes = await context.previewChanges();
        // debugger;
        // console.log(changes)
        debugger;
        const contextFactory = new DbContextFactory();
        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(ExternalDataContext, dbname);

        const [newBook] = await context.books.add({
            author: "James",
            publishDate: new Date()
        });


        const x = await context.booksV3.first();

        await context.saveChanges();


        const book = await context.books.pluck(w => w.author === "James", "author");
       
    } catch (e) {
        console.log(e)
    }

}

run(); 
