import { PouchDbRecord, PouchDbPlugin } from "@agrejus/db-framework-plugin-pouchdb";
import { contextBuilder } from "../../context/builder/context-builder";
import { IDbRecord, IDbRecordBase } from "../../types/entity-types";
import { DocumentTypes, IBook, IBookV3, IBookV4, ICar, IComputer, IContact, INote, IPreference, ISetStatus, ISyncDocument } from "./models";
import { DataContext } from "../../context/DataContext";
import { IDbPluginOptions } from "../../types/plugin-types";
import { DefaultDbSetBuilder } from "../../context/dbset/builders/DefaultDbSetBuilder";
import { IDbSetBuilderParams } from "../../types/dbset-builder-types";
import { IDbSet } from "../../types/dbset-types";
import { generateRandomId } from '../../common/helpers';

export const ContextBuilderEntityChangeTrackingContextBuilder = (changeTrackingType: "context" | "entity") => contextBuilder<DocumentTypes>({ changeTrackingType })
    .useBaseRecord<PouchDbRecord<DocumentTypes>>()
    .useExclusions()
    .usePlugin(() => ({ dbName: `test-builder-${generateRandomId()}-db` }), PouchDbPlugin)
    .createDefault((Base) => {
        return class extends Base {

            types = {
                map: {} as typeof this.cars.types.map & typeof this.books.types.map
            }

            onChange(documentType: DocumentTypes, type: any, data: IDbRecord<DocumentTypes>[]) {
                // all 
                // what if we have the store dbset automatically implement onChange?
                console.log('onChange', documentType, data, type)
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
    });

export class EntityChangeTrackingContext extends DataContext<DocumentTypes, PouchDbRecord<DocumentTypes>, "_id" | "_rev", IDbPluginOptions, PouchDbPlugin<DocumentTypes, PouchDbRecord<DocumentTypes>, IDbPluginOptions>> {

    constructor(changeTrackingType: "context" | "entity") {
        super({ dbName: `test-${generateRandomId()}-db` }, PouchDbPlugin, { changeTrackingType, environment: "development" });
    }

    types = {
        map: {} as typeof this.cars.types.map & typeof this.books.types.map
    }

    onChange(documentType: DocumentTypes, type: any, data: IDbRecord<DocumentTypes>[]) {
        // all 
        // what if we have the store dbset automatically implement onChange?
        console.log('onChange', documentType, data, type)
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

const contexts: { destroyDatabase(): Promise<void> }[] = [];

export const getContexts = () => {

    return {
        types: ["context-builder-context-tracking", "default-context-tracking", "context-builder-entity-tracking", "default-entity-tracking"] as ("context-builder-context-tracking" | "default-context-tracking" | "context-builder-entity-tracking" | "default-entity-tracking")[],
        dispose: async () => {
            for (const context of contexts) {
                await context.destroyDatabase();
            }
        },
        getContext: (type: "context-builder-context-tracking" | "default-context-tracking" | "context-builder-entity-tracking" | "default-entity-tracking") => {

            if (type === "context-builder-context-tracking") {
                const Creator = ContextBuilderEntityChangeTrackingContextBuilder("context");

                const result = new Creator();

                contexts.push(result);

                return result;
            }

            if (type === "default-context-tracking") {
                const result = new EntityChangeTrackingContext("context");

                contexts.push(result);

                return result;
            }

            if (type === "context-builder-entity-tracking") {
                const Creator = ContextBuilderEntityChangeTrackingContextBuilder("entity");

                const result = new Creator();

                contexts.push(result);

                return result;
            }

            if (type === "default-entity-tracking") {
                const result = new EntityChangeTrackingContext("entity");

                contexts.push(result);

                return result;
            }

            throw new Error(`Context not found for type.  Type: ${type}`)
        }
    };
}
