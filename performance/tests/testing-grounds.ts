
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
import { shouldFilterEntitiesWithDefaults } from "../../src/__tests__/integration/shared/common-tests";

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
    .createDefault("createDefault", (Base) => {
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
        //const contextFactory = new DbContextFactory();

        // const context = new ExternalDataContext("test-db");
        // const all = await context.computers.all();
        // console.log(all);


        // const [contact] = await context.computers.add({
        //     cores: 8,
        //     name: "Some Name"
        // });

        // await context.saveChanges();

        // contact.name = "TEst";

        // const changes = await context.previewChanges();

        // console.log(changes)


        const contextFactory = new DbContextFactory();
        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(ExternalDataContext, dbname);

        const s1 = performance.now();

        for(let i = 0; i < 1000; i++) {
            await context.books.add({
                author: faker.random.word(),
                publishDate: faker.date.between('2010-01-01', '2024-01-01')
            });
        }

        console.log('adds', performance.now() - s1)


        // const x = await context.booksV3.first();
        // const y = await context2.booksV3.first();

        const s = performance.now();
        const saved = await context.saveChanges();
        console.log(performance.now() - s)
        console.log(saved)
       

        for(let i = 0; i < 1000; i++) {
            await context.books.add({
                author: faker.random.word(),
                publishDate: faker.date.between('2010-01-01', '2024-01-01')
            });
        }

        const s2 = performance.now();
        const saved2 = await context.saveChanges();
        console.log(performance.now() - s2)

        const found = await context.books.find(w => w.author === "James");

        if (found != null) {
            console.log(found.someProperty)
        }

        const author = await context.books.pluck(w => w.author === "James", "someProperty");

        console.log(author)
       
    } catch (e) {
        console.error(e)
    }

}

run(); 
