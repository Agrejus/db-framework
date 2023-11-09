import { DataContext } from "../../src/context/DataContext";
import { IDbRecord } from "../../src/types/entity-types";
import { PouchDbPlugin, PouchDbRecord } from "@agrejus/db-framework-plugin-pouchdb";
import { IDbPluginOptions } from "../../src/types/plugin-types";
import { contextBuilder } from "../../src/context/builder/context-builder";
import { DbSetRemoteChanges } from "../../src/types/dbset-types";
import { StatefulDataContext } from "../../src/context/StatefulDataContext";
import { DbContextFactory, ExternalDataContext } from "../../src/__tests__/integration/shared/context";

enum DocumentTypes {
    Notes = "Notes",
    Contacts = "Contacts",
    Books = "Books",
    Cars = "Cars",
    Preference = "Preference",
    ExtendedBooks = "ExtendedBooks"
}

interface IPreference extends PouchDbRecord<DocumentTypes> {
    isSomePropertyOn: boolean;
    isOtherPropertyOn: boolean;
}

interface IBaseEntity extends PouchDbRecord<DocumentTypes> {
    syncStatus: "pending" | "approved" | "rejected";
    syncRetryCount: 0;
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

const TestDataContext = contextBuilder<DocumentTypes>()
    .useBaseRecord<PouchDbRecord<DocumentTypes>>()
    .useExclusions()
    .usePlugin({ dbName: "test-builder-db" }, PouchDbPlugin)
    .createStateful((Base) => {
        return class extends Base {

            types = {
                map: {} as typeof this.cars.types.map & typeof this.books.types.map
            }


            onChange(documentType: DocumentTypes, type: any, data: IDbRecord<DocumentTypes>[]) {
                // all 
                // what if we have the store dbset automatically implement onChange?
                console.log('onChange', documentType, data, type)
            }

            books = this.dbset().stateful<IBook>(DocumentTypes.Books)
                .onChange((d, w, c) => { this.onChange(d, w, c.all) })
                //.defaults({ test: "Winner" })
                .keys(w => w.add("author").add("test"))
                .filter(w => w.test == "Winner")
                .create();

            cars = this.dbset().stateful<ICar>(DocumentTypes.Cars)
                .onChange((d, w, c) => { this.onChange(d, w, c.all) })
                .keys(w => w.auto())
                .create();
        }
    });

class ExternalDbDataContext extends StatefulDataContext<DocumentTypes, PouchDbRecord<DocumentTypes>, "_id" | "_rev", IDbPluginOptions, PouchDbPlugin<DocumentTypes, PouchDbRecord<DocumentTypes>, IDbPluginOptions>> {

    constructor() {
        super({ dbName: "Test" }, PouchDbPlugin, { environment: "development" });
    }

    types = {
        map: {} as typeof this.cars.types.map & typeof this.books.types.map
    }


    onChange(documentType: DocumentTypes, type: any, data: DbSetRemoteChanges<DocumentTypes, PouchDbRecord<DocumentTypes>>) {
        // all 
        // what if we have the store dbset automatically implement onChange?
        console.log('onChange', documentType, data, type)
    }

    books = this.dbset().stateful<IBook>(DocumentTypes.Books)
        .onChange((d, w, c) => { this.onChange(d, w, c) })
        .defaults({ test: "Winner" })
        .keys(w => w.add("author").add("test"))
        .filter(w => w.test == "Winner")
        .create();

    cars = this.dbset().stateful<ICar>(DocumentTypes.Cars)
        .onChange((d, w, c) => { this.onChange(d, w, c) })
        .keys(w => w.auto())
        .create();

    books2 = this.dbset().default<IBook>(DocumentTypes.ExtendedBooks).create();
}

// const runTest = async () => {
//     const context = new ExternalDbDataContext();

//     const [bookOne, bookTwo] = await context.books2.add({
//         author: "James",
//         rejectedCount: 1,
//         syncStatus: "pending",
//         status: "pending"
//     }, {
//         author: "Megan",
//         rejectedCount: 1,
//         syncStatus: "pending",
//         status: "pending"
//     });

//     // Add
//     await context.saveChanges();

//     // no changes here

//     let foundOne = await context.books2.find(w => w._id === bookOne._id);
//     let foundTwo = await context.books2.find(w => w._id === bookTwo._id);

//     if (foundOne == null || foundTwo == null) {
//         return;
//     }

//     let changes = await context.previewChanges();

//     bookOne.status = "rejected";

//     changes = await context.previewChanges();


//     // Make First Change
//     await context.saveChanges();

//     foundOne = await context.books2.find(w => w._id === foundOne!._id);

//     changes = await context.previewChanges();

//     bookTwo.status = "approved";

//     // Change Second Change
//     changes = await context.previewChanges()

//     const count = await context.saveChanges();

//     console.log(changes)
    

//     foundTwo = await context.books2.find(w => w._id === foundTwo!._id);
// }

export const run = async () => {
    try {
        const contextFactory = new DbContextFactory();
        const context = contextFactory.createContext(ExternalDataContext);

        const [book] = await context.books.add({
            author: "James DeMeuse",
            publishDate: new Date()
        });

        await context.saveChanges();

        const found = await context.books.first();

        const x = Object.prototype.toString.call(found?.publishDate);

    } catch (e) {
        console.log(e)
    }

}

run(); 