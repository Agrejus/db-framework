import { ExternalDataContext } from "../../src/__tests__/integration/shared/context";
import { DataContext } from "../../src/context/DataContext";
import { IDbRecord } from "../../src/types/entity-types";
import { PouchDbPlugin, PouchDbRecord } from "@agrejus/db-framework-plugin-pouchdb";
import { IDbPluginOptions } from "../../src/types/plugin-types";
import { contextBuilder } from "../../src/context/builder/context-builder";

enum DocumentTypes {
    Notes = "Notes",
    Contacts = "Contacts",
    Books = "Books",
    Cars = "Cars",
    Preference = "Preference"
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

interface IBook extends PouchDbRecord<DocumentTypes.Books> {
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
.create((Base) => {
    return class extends Base {

        types = {
            map: {} as typeof this.cars.types.map & typeof this.books.types.map
        }
    
    
        onChange(documentType: DocumentTypes, type: any, data: IDbRecord<DocumentTypes>[]) {
            // all 
            // what if we have the store dbset automatically implement onChange?
            console.log('onChange', documentType, data, type)
        }
    
        books = this.dbset().store<IBook>(DocumentTypes.Books)
            .onChange((d, w, c) => { this.onChange(d, w, c.all) })
            .defaults({ test: "Winner" })
            .keys(w => w.add("author").add("test"))
            .filter(w => w.test == "Winner")
            .create();
    
        cars = this.dbset().store<ICar>(DocumentTypes.Cars)
            .onChange((d, w, c) => { this.onChange(d, w, c.all) })
            .keys(w => w.auto())
            .create();
    }
});

class ExternalDbDataContext extends DataContext<DocumentTypes, PouchDbRecord<DocumentTypes>, "_id" | "_rev", IDbPluginOptions, PouchDbPlugin<DocumentTypes, PouchDbRecord<DocumentTypes>, IDbPluginOptions>> {

    constructor() {
        super({ dbName: "Test"}, PouchDbPlugin, { changeTrackingType: "context" });
    }

    types = {
        map: {} as typeof this.cars.types.map & typeof this.books.types.map
    }


    onChange(documentType: DocumentTypes, type: any, data: IDbRecord<DocumentTypes>[]) {
        // all 
        // what if we have the store dbset automatically implement onChange?
        console.log('onChange', documentType, data, type)
    }

    books = this.dbset().store<IBook>(DocumentTypes.Books)
        .onChange((d, w, c) => { this.onChange(d, w, c.all) })
        .defaults({ test: "Winner" })
        .keys(w => w.add("author").add("test"))
        .filter(w => w.test == "Winner")
        .create();

    cars = this.dbset().store<ICar>(DocumentTypes.Cars)
        .onChange((d, w, c) => { this.onChange(d, w, c.all) })
        .keys(w => w.auto())
        .create();
}

const runTest = async () => {
    const context = new ExternalDbDataContext();

    const [bookOne, bookTwo] = await context.books.add({
        author: "James",
        rejectedCount: 1,
        status: "pending",
        syncStatus: "pending"
    }, {
        author: "Megan",
        rejectedCount: 1,
        status: "pending",
        syncStatus: "pending"
    });

    // Add
    await context.saveChanges();

    let foundOne = await context.books.find(w => w._id === bookOne._id);
    let foundTwo = await context.books.find(w => w._id === bookTwo._id);

    foundOne!.status = "rejected";

    // Make First Change
    await context.saveChanges();

    foundOne = await context.books.find(w => w._id === foundOne!._id);


    foundTwo!.status = "approved";
    debugger;
    // Change Second Change
    const count = await context.saveChanges();

    foundTwo = await context.books.find(w => w._id === foundTwo!._id);
    debugger;

}

export const run = async () => {
    try {
        await runTest();

        const context = new ExternalDbDataContext();

        await context.books.hydrate();
        await context.cars.hydrate();

        console.log('context.books.store', context.books.store)
        console.log('context.cars.store', context.cars.store)

        await context.saveChanges();

        await context.cars.add({
            make: "Chevy",
            manufactureDate: new Date().toISOString(),
            model: "Silverado",
            year: 2021
        })

        await context.books.tag('added by user').add({
            author: "James",
            rejectedCount: 1,
            status: "pending",
            syncStatus: "approved"
        },
            {
                author: "James1",
                rejectedCount: 2,
                status: "pending",
                syncStatus: "approved"
            });

        await context.saveChanges();

    } catch (e) {
        console.log(e)
    }

}

run(); 