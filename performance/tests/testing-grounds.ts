import { DataContext } from "../../src/context/DataContext";
import { IDbRecord } from "../../src/types/entity-types";
import { EntityAndTag } from "../../src/types/dbset-types";

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

class PouchDbDataContext extends DataContext<DocumentTypes> {

    // constructor() {
    //     super(`${uuidv4()}-db`);
    // }

    map: typeof this.cars.types.map & typeof this.books.types.map = {
        Cars: {} as any,
        Books: {} as any
    }

    constructor() {
        super(`test-db`);

        this.onChange(DocumentTypes.Cars, data => {

        })
    }

    types = {
        map: {} as typeof this.cars.types.map & typeof this.books.types.map
    }

    onChange<TDocumentType extends keyof typeof this.types.map, TEntity extends typeof this.types.map[TDocumentType]>(documentType: TDocumentType, callback: (data: TEntity[]) => void) {

    }

    protected async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }) {
        const changes = getChanges();
        debugger;
        console.log(changes);
    }

    books = this.dbset().default<IBook>(DocumentTypes.Books)
        .defaults({ test: "Winner" })
        .keys(w => w.add("author").add("test"))
        .filter(w => w.test == "Winner")
        .create();

    cars = this.dbset().default<ICar>(DocumentTypes.Cars)
        .keys(w => w.auto())
        .create();
}

export const run = async () => {
    try {

        const context = new PouchDbDataContext();
        // const deletes = await context.books.filter(w => w.author === "James");
        // await context.books.remove(...deletes);
        await context.saveChanges();

        const [added] = await context.books.tag('added by user').add({
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

        debugger;
        const found = await context.books.filter(w => w._id === added._id && (w.DocumentType == DocumentTypes.Books && (w.rejectedCount === 0 || w.author == "James")) && w._rev === "1");

        debugger;
        // // await context.books.remove(added._id);

        // // await context.saveChanges();

        // const db = new PouchDB('test-size-db');
        // const docs: { _id: string, content: string }[] = [];
        // for (let i = 0; i < 100; i++) {
        //     docs.push({
        //         _id: `some_id-${i}`,
        //         content: loremIpsum + loremIpsum + loremIpsum + loremIpsum + loremIpsum + loremIpsum + loremIpsum + loremIpsum + loremIpsum + loremIpsum + loremIpsum
        //     })
        // }

        // await db.bulkDocs(docs);
        // debugger;
        // const allDocs = await db.find({
        //     selector: {
        //         _id: { $in: docs.map(w => w._id) }
        //     }
        // })
        // debugger
        // for (const doc of allDocs.docs) {
        //     await (db as any).purge(doc._id, doc._rev)
        // }

        // const [f] = await context.books.withoutReference().get(added._id)
        // await context.books.remove(f)
        // debugger;
        // await context.saveChanges();
        // const book = await context.books.withoutReference().find(w => w._id === added._id);
        // const book2 = await context.books.find(w => w._id === added._id);
        // // const car = await context.cars.find(w => w._id === addedCar._id);

        // const all = await context.getAllDocs();

        // // console.log(book, car, all)

        // const [found] = await context.books.filter(w => w._id === ""
        //     && (w.DocumentType === DocumentTypes.Books || w.author === "James" || (w.status === "approved" || w.author === "Megan"))
        //     && (w.DocumentType === DocumentTypes.Books || w.author === "James")
        // );
        // // await context.books.remove(found);
        // await context.saveChanges();
        // debugger;
        // console.log(found)
        // await generateData(context, 10000);

        // const s = performance.now();
        // const all = await context.contacts.filter(w => w.randomNumber === 10);
        // console.log(all.length);
        // const e = performance.now();
        // await context.destroyDatabase();
        // console.log('time', e - s);

        // if (true) {

        // }


        // Document Splitting

    } catch (e) {
        console.log(e)
    }

}

run(); 