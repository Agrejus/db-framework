import { DataContext } from "../../src/context/DataContext";
import { IDbRecord } from "../../src/types/entity-types";
import { EntityAndTag } from "../../src/types/dbset-types";
import { IDbPluginOptions } from "../../src/types/plugin-types";
import { PouchDbPlugin } from "../../src/plugins/PouchDbPlugin";

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

class PouchDbDataContext extends DataContext<DocumentTypes, IDbRecord<DocumentTypes>, IDbPluginOptions, PouchDB.Find.FindRequest<IDbRecord<DocumentTypes>>, PouchDB.Find.FindResponse<IDbRecord<DocumentTypes>>> {

    constructor() {
        super({ dbName: "Test" }, PouchDbPlugin);
    }

    types = {
        map: {} as typeof this.cars.types.map & typeof this.books.types.map
    }


    onChange(documentType: DocumentTypes, type: any, data: IDbRecord<DocumentTypes>[]) {
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

export const run = async () => {
    try {
        debugger;
        const context = new PouchDbDataContext();

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