import { DbContextFactory, ExternalDataContext } from "../../src/__tests__/integration/shared/context";
import { DataContext } from "../../src/context/DataContext";
import { IDbRecord } from "../../src/types/entity-types";
import { PouchDbPlugin } from "@agrejus/db-framework-plugin-pouchdb";
import { IDbPluginOptions } from "../../src/types/plugin-types";

enum DocumentTypes {
    Notes = "Notes",
    Contacts = "Contacts",
    Books = "Books",
    Cars = "Cars",
    Preference = "Preference"
}

interface IPreference extends IDbRecord<DocumentTypes> {
    isSomePropertyOn: boolean;
    isOtherPropertyOn: boolean;
}

interface IBaseEntity extends IDbRecord<DocumentTypes> {
    syncStatus: "pending" | "approved" | "rejected";
    syncRetryCount: 0;
}

interface INote extends IDbRecord<DocumentTypes> {
    contents: string;
    createdDate: string;
    userId: string;
}

interface IBook extends IDbRecord<DocumentTypes.Books> {
    author: string;
    publishDate?: string;
    rejectedCount: number;
    status: "pending" | "approved" | "rejected";
    syncStatus: "pending" | "approved" | "rejected";
    test?: string
}

interface ICar extends IDbRecord<DocumentTypes.Cars> {
    make: string;
    model: string;
    year: number;
    manufactureDate: string;
}

class ExternalDbDataContext extends DataContext<DocumentTypes, IDbRecord<DocumentTypes>, IDbPluginOptions, PouchDbPlugin<DocumentTypes, IDbRecord<DocumentTypes>, IDbPluginOptions>> {

    constructor() {
        super({ dbName: "Test"}, PouchDbPlugin);
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
    const contextFactory = new DbContextFactory();
    const dbname = contextFactory.getRandomDbName();
    const context = contextFactory.createContext(ExternalDataContext, dbname);

    const all = await context.notes.all();

    const [one] = await context.notes.upsert({
        contents: "some contents",
        createdDate: new Date(),
        userId: "some user"
    });

    await context.saveChanges();

    const [two] = await context.notes.upsert({
        contents: "some contents",
        createdDate: new Date(),
        userId: "some user"
    });

    await context.saveChanges();

    const allAfterAdd = await context.notes.all();

    const foundOne = await context.notes.find(w => w._id === one._id);
    debugger;
    const [upsertedOne, upsertedTwo] = await context.notes.upsert({
        _id: one._id,
        contents: "changed contents",
        createdDate: new Date(),
        userId: "changed user"
    }, {
        contents: "changed contents 2",
        createdDate: new Date(),
        userId: "changed user 2"
    });
    debugger;
    await context.saveChanges();

    const foundUpsertOne = await context.notes.find(w => w._id === one._id);
    debugger;
    console.log({ ...upsertedOne, createdDate: upsertedOne.createdDate.toISOString() }, foundUpsertOne);
}

export const run = async () => {
    try {
        await runTest();
        debugger;
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
        debugger;
        await context.saveChanges();

    } catch (e) {
        console.log(e)
    }

}

run(); 