import { ContextOptions } from "../../../../dist";
import { IDbRecord } from "../../../types/entity-types";
import { DocumentTypes, IPouchDbRecord } from "../../../__tests__/integration/shared/types";
import { IDbPlugin, IDbPluginOptions } from "../../../types/plugin-types";
import { DataContext } from "../../DataContext";
import { IPouchDbPluginOptions, PouchDbPlugin } from "@agrejus/db-framework-plugin-pouchdb";

export const useDbSetCreator = <
    TDocumentType extends string,
    TEntityBase extends IDbRecord<TDocumentType>,
    TExclusions extends keyof TEntityBase,
    TPluginOptions extends IDbPluginOptions,
    TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions>,
    T
>(callback: (creator: DataContext<TDocumentType, TEntityBase, TExclusions, TPluginOptions, TDbPlugin>) => T) => {
    return callback
}

// export abstract class DataContext<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntityBase, TPluginOptions extends IDbPluginOptions = IDbPluginOptions, TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions> = IDbPlugin<TDocumentType, TEntityBase, TExclusions>> implements IDataContext<TDocumentType, TEntityBase> {

//     private _tags: { [id: string]: unknown } = {}

//     abstract contextId(): string;

//     protected readonly dbPlugin: TDbPlugin;
//     protected dbsetMap: DbSetMap = {} as DbSetMap;
//     private _onBeforeSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent<TDocumentType, TEntityBase> } = {} as any;
//     private _onAfterSaveChangesEvents: { [key in TDocumentType]: OnChangeEvent<TDocumentType, TEntityBase> } = {} as any;
//     private readonly _options: TPluginOptions;
//     private readonly _contextOptions: ContextOptions;
//     private _readonlyDocumentTypes: { [key: string]: true } = {}
//     private _changeTracker: ContextChangeTrackingAdapter<TDocumentType, TEntityBase, TExclusions>;

//     readonly dbsets = new DbSetCollection(this.dbsetMap);

//     get dbName() {
//         return this._options.dbName;
//     }

//     constructor(options: TPluginOptions, Plugin: z<TDocumentType, TEntityBase, TExclusions, TDbPlugin>, contextOptions: ContextOptions = { environment: "development" }) {
//         this._options = options;
//         this._contextOptions = contextOptions;
//         this.dbPlugin = new Plugin(options);
//         this._changeTracker = new ContextChangeTrackingAdapter();

//         MonitoringMixin.register(this.contextId(), this._contextOptions, this, DataContext as any);
//     }


// const dataContextWithParamsCreator = (type: string, name?: string) => 
// new class extends DataContext<DocumentTypes, IPouchDbRecord<DocumentTypes>, "_id" | "_rev", IDbPluginOptions, PouchDbPlugin<DocumentTypes, IPouchDbRecord<DocumentTypes>, IDbPluginOptions>> {

//     constructor() {
//         super({ dbName: name ?? `${uuidv4()}-db` }, PouchDbPlugin);
//     }

//     contextId(): string {
//         return "dataContextWithParamsCreator"
//     }

//     carsWithDefault = this.dbset().default<ICar>(DocumentTypes.CarsWithDefault)
//         .defaults({ make: type })
//         .exclude("make")
//         .keys(w => w.add("model").add("make"))
//         .filter(w => w.make === type)
//         .create();
// }

/*

    useContextBuilder(contextOptions: ContextOptions = { environment = "Development" }) {

        return {
            exclude: (...exclusions: string[]) => {
                return this;
            },
            plugin() {

            }
        }
    };




*/

const useContextBuilder = (contextOptions: ContextOptions = { environment: "development" }) => {

    return {
        documentTypes: <TDocumentType extends string>() => {
            return {
                document<TEntityBase extends IDbRecord<TDocumentType>>() {
                    return {
                        plugin<TPluginOptions extends IDbPluginOptions>(options: TPluginOptions) {
                            return {
                                use<TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, never>>(Plugin: new (options: TPluginOptions) => TDbPlugin) {
                                    return class extends DataContext<TDocumentType, TEntityBase, never, TPluginOptions, TDbPlugin> {
                                        constructor() {
                                            super(options, Plugin, contextOptions)
                                        }

                                        contextId() {
                                            return "some-name"
                                        }
                                    };
                                }
                            }
                        },
                        exclude<TExclusions extends keyof TEntityBase>(...exclusions: TExclusions[]) {
                            return {
                                plugin<TPluginOptions extends IDbPluginOptions>(options: TPluginOptions) {
                                    return {
                                        use<TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions>>(Plugin: new (options: TPluginOptions) => TDbPlugin) {

                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

useContextBuilder()
    .documentTypes<DocumentTypes>()
    .document<IPouchDbRecord<DocumentTypes>>()
    .exclude("_id", "_rev")
    .plugin<IPouchDbPluginOptions>({ dbName: "some-new-database" })
    .use(PouchDbPlugin);