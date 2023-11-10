import { DataContext } from "../../../context/DataContext";
import { IDbSet } from "../../../types/dbset-types";
import { IDbRecordBase } from "../../../types/entity-types";
import { DocumentTypes, ISyncDocument, ISetStatus, IComputer, IBook, IBookV4, INote, IContact, IBookV3, ICar, IPreference, IPouchDbRecord } from "./types";
import { v4 as uuidv4 } from 'uuid';
import { DefaultDbSetBuilder } from "../../../context/dbset/builders/DefaultDbSetBuilder";
import { PouchDbPlugin } from "@agrejus/db-framework-plugin-pouchdb";
import { IDbSetBuilderParams } from "../../../types/dbset-builder-types";
import { ContextOptions } from "../../../types/context-types";
import { IDbPluginOptions } from "../../../types/plugin-types";

const dataContextWithParamsCreator = (type: string, name?: string) => new class extends DataContext<DocumentTypes, IPouchDbRecord<DocumentTypes>, "_id" | "_rev", IDbPluginOptions, PouchDbPlugin<DocumentTypes, IPouchDbRecord<DocumentTypes>, IDbPluginOptions>> {

    constructor() {
        super({ dbName: name ?? `${uuidv4()}-db` }, PouchDbPlugin);
    }

    carsWithDefault = this.dbset().default<ICar>(DocumentTypes.CarsWithDefault)
        .defaults({ make: type })
        .exclude("make")
        .keys(w => w.add("model").add("make"))
        .filter(w => w.make === type)
        .create();
}

const context = dataContextWithParamsCreator("");
export const ExternalDbDataContextWithDefaults = context;

export class ExternalDataContext extends DataContext<DocumentTypes, IPouchDbRecord<DocumentTypes>, "_id" | "_rev", IDbPluginOptions, PouchDbPlugin<DocumentTypes, IPouchDbRecord<DocumentTypes>, IDbPluginOptions>> {

    constructor(name: string, contextOptions: ContextOptions = { environment: "development" }) {
        super({ dbName: name.endsWith("-db") ? name : `${name}-db` }, PouchDbPlugin, contextOptions);
    }

    private _setupSyncDbSet<T extends ISyncDocument<DocumentTypes>>(documentType: DocumentTypes) {

        const dbset = (this.dbset().default<ISyncDocument<DocumentTypes>>(documentType)
            .defaults({ SyncStatus: "Pending", SyncRetryCount: 0 })
            .exclude("SyncStatus", "SyncRetryCount") as any) as DefaultDbSetBuilder<DocumentTypes, T, "SyncStatus" | "SyncRetryCount", IDbSet<DocumentTypes, T, "SyncStatus" | "SyncRetryCount">, IDbSetBuilderParams<DocumentTypes, T, "SyncStatus" | "SyncRetryCount", IDbSet<DocumentTypes, T, "SyncStatus" | "SyncRetryCount">>>;

        return dbset.extend((Instance, props) => {
            return new class extends Instance {
                constructor() {
                    super(props);
                    this.toStatus = this.toStatus;
                }

                async toStatus(docs?: IDbRecordBase[]) {

                    let items: any[] = [];

                    if (docs != null) {
                        items = super.match(...docs);
                    } else {
                        items = await super.all();
                    }

                    return {
                        failed: items.filter(w => w.SyncStatus === "Failed").length,
                        pending: items.filter(w => w.SyncStatus === "Pending").length,
                        succeeded: items.filter(w => w.SyncStatus === "Succeeded").length
                    } as ISetStatus
                }
            }
        });
    }

    computers = this.dbset().default<IComputer>(DocumentTypes.Computers).create();

    books = this.dbset().default<IBook>(DocumentTypes.Books).defaults({ status: "pending" }).exclude("status", "rejectedCount").create();
    booksWithDateMapped = this.dbset().default<IBookV4>(DocumentTypes.BooksWithDateMapped)
        .defaults({ status: "pending" })
        .exclude("status", "rejectedCount")
        .map({ property: "publishDate", map: w => !!w ? new Date(w) : undefined })
        .map({ property: "createdDate", map: w => new Date(w) })
        .create();
    booksWithOn = this.dbset().default<IBook>(DocumentTypes.BooksWithOn).exclude("status", "rejectedCount").create();

    booksWithOnV2 = this.dbset().default<IBook>(DocumentTypes.BooksWithOnV2).exclude("status", "rejectedCount").create();

    booksNoKey = this.dbset().default<IBook>(DocumentTypes.BooksNoKey).exclude("status", "rejectedCount").keys(w => w.none()).create();
    notes = this.dbset().default<INote>(DocumentTypes.Notes).create();
    contacts = this.dbset().default<IContact>(DocumentTypes.Contacts).keys(w => w.add("firstName").add("lastName")).create();
    booksV3 = this._setupSyncDbSet<IBookV3>(DocumentTypes.BooksV3).create();
    booksV4 = this._setupSyncDbSet<IBookV3>(DocumentTypes.BooksV4).extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }

            otherFirst() {
                return super.first();
            }
        }
    }).create();
    cars = this.dbset().default<ICar>(DocumentTypes.Cars).keys(w => w.add(x => x.manufactureDate.toISOString()).add(x => x.make).add("model")).create();
    preference = this.dbset().default<IPreference>(DocumentTypes.Preference).keys(w => w.add(_ => "static")).create();
    preferencev2 = this.dbset().default<IPreference>(DocumentTypes.PreferenceV2).keys(w => w.add(() => "")).create();
    readonlyPreference = this.dbset().default<IPreference>(DocumentTypes.ReadonlyPreference).keys(w => w.add(_ => "static")).readonly().create();

    overrideContactsV2 = this.dbset().default<IContact>(DocumentTypes.OverrideContactsV2).keys(w => w.add("firstName").add("lastName")).extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }

            otherFirst() {
                return super.first();
            }
        }
    }).create();

    overrideContactsV3 = this.dbset().default<IContact>(DocumentTypes.OverrideContactsV3).keys(w => w.add("firstName").add("lastName")).extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }

            otherFirst() {
                return super.first();
            }
        }
    }).extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }

            otherOtherFirst() {
                return super.first();
            }
        }
    }).create();

    booksWithDefaults = this.dbset().default<IBook>(DocumentTypes.BooksWithDefaults).defaults({ status: "pending", rejectedCount: 0 }).exclude("status", "rejectedCount").create();
    booksWithDefaultsV2 = this.dbset().default<IBook>(DocumentTypes.BooksWithDefaultsV2).defaults({ status: "pending", rejectedCount: 0 }).exclude("status", "rejectedCount").extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }
        }
    }).create();
    booksWithTwoDefaults = this.dbset().default<IBook>(DocumentTypes.BooksWithTwoDefaults).defaults({ add: { status: "pending", rejectedCount: 0 }, retrieve: { status: "approved", rejectedCount: -1 } }).exclude("status", "rejectedCount").create();
    booksNoDefaults = this.dbset().default<IBook>(DocumentTypes.BooksWithNoDefaults).exclude("status", "rejectedCount").create();

    booksWithIndex = this.dbset().default<IBook>(DocumentTypes.BooksWithIndex).exclude("status", "rejectedCount").create();



    notesWithMapping = this.dbset().default<INote>(DocumentTypes.NotesWithMapping).map({ property: "createdDate", map: w => new Date(w) }).create();
}

export class BooksWithOneDefaultContext extends DataContext<DocumentTypes, IPouchDbRecord<DocumentTypes>, "_id" | "_rev", IDbPluginOptions, PouchDbPlugin<DocumentTypes, IPouchDbRecord<DocumentTypes>, IDbPluginOptions>> {

    constructor(name: string) {
        super({ dbName: name }, PouchDbPlugin);
    }

    booksWithDefaults = this.dbset().default<IBook>(DocumentTypes.BooksWithDefaults).exclude("status", "rejectedCount").create();
    booksWithDefaultsV2 = this.dbset().default<IBook>(DocumentTypes.BooksWithDefaultsV2).defaults({ status: "pending", rejectedCount: 0 }).exclude("status", "rejectedCount").extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }
        }
    }).create();
}


export class BooksWithTwoDefaultContext extends DataContext<DocumentTypes, IPouchDbRecord<DocumentTypes>, "_id" | "_rev", IDbPluginOptions, PouchDbPlugin<DocumentTypes, IPouchDbRecord<DocumentTypes>, IDbPluginOptions>> {

    constructor(name: string) {
        super({ dbName: name.endsWith("-db") ? name : `${name}-db` }, PouchDbPlugin);
    }

    booksWithTwoDefaults = this.dbset().default<IBook>(DocumentTypes.BooksWithTwoDefaults).exclude("status", "rejectedCount").create();
}

export class DbContextFactory {

    private _dbs: { [key: string]: DataContext<DocumentTypes, IPouchDbRecord<DocumentTypes>, "_id" | "_rev", IDbPluginOptions, PouchDbPlugin<DocumentTypes, IPouchDbRecord<DocumentTypes>, IDbPluginOptions>> } = {}

    getRandomDbName() {
        return uuidv4();
    }

    createContextWithParams(type: string, name?: string) {
        return dataContextWithParamsCreator(type, name)
    }

    createContext<T extends typeof ExternalDataContext>(Context: T, dbname?: string, type?: string) {
        const name = dbname ?? `${uuidv4()}-db`;
        const result = new Context(name);
        this._dbs[name] = result;
        return result;
    }

    createDbContexts<T extends DataContext<DocumentTypes, IPouchDbRecord<DocumentTypes>, "_rev" | "_id", IDbPluginOptions, PouchDbPlugin<DocumentTypes, IPouchDbRecord<DocumentTypes>, IDbPluginOptions>>>(factory: (name: string) => T[]) {
        const name = `${uuidv4()}-db`;
        const contexts = factory(name);

        for (const context of contexts) {
            this._dbs[name] = context;
        }

        return contexts;
    }

    async cleanupAllDbs() {
        const dbNames = Object.keys(this._dbs)
        await Promise.all(dbNames.map(w => this._dbs[w].destroyDatabase()));
    }
}