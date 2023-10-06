import { ExternalDataContext } from "../../src/__tests__/integration/shared/context";
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

interface IPouchDbRecord<TDocumentType extends string> extends IDbRecord<TDocumentType> {
    readonly _id: string;
    readonly _rev: string;
}

interface IPreference extends IPouchDbRecord<DocumentTypes> {
    isSomePropertyOn: boolean;
    isOtherPropertyOn: boolean;
}

interface IBaseEntity extends IPouchDbRecord<DocumentTypes> {
    syncStatus: "pending" | "approved" | "rejected";
    syncRetryCount: 0;
}

interface INote extends IPouchDbRecord<DocumentTypes> {
    contents: string;
    createdDate: string;
    userId: string;
}

interface IBook extends IPouchDbRecord<DocumentTypes.Books> {
    author: string;
    publishDate?: string;
    rejectedCount: number;
    status: "pending" | "approved" | "rejected";
    syncStatus: "pending" | "approved" | "rejected";
    test?: string
}

interface ICar extends IPouchDbRecord<DocumentTypes.Cars> {
    make: string;
    model: string;
    year: number;
    manufactureDate: string;
}

class ExternalDbDataContext extends DataContext<DocumentTypes, IPouchDbRecord<DocumentTypes>, "_id" | "_rev", IDbPluginOptions, PouchDbPlugin<DocumentTypes, IPouchDbRecord<DocumentTypes>, IDbPluginOptions>> {

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
    const context = new ExternalDataContext("Test-db", { changeTrackingType: "context" })

    const [book] = await context.books.add({ 
        author: "James",
        publishDate: new Date()
    });

    await context.saveChanges();

    const found = await context.books.find(w => w._id === book._id);

    if (found == null) {
        expect(1).toBe(2);
        return;
    }

    found.status = "rejected";
    await context.saveChanges();

    found.status = "approved";
    await context.saveChanges();

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
        debugger;
        await context.saveChanges();

    } catch (e) {
        console.log(e)
    }

}

run(); 