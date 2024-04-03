import { IDbPlugin, IBulkOperationsResponse, IBulkOperation, IQueryParams, DbPluginOperations, Transactions, IDbRecord, IDbPluginOptions } from '@agrejus/db-framework';
import { IndexedDbRecord } from './types';
import { IDBPDatabase, IDBPTransaction, openDB } from 'idb';

interface IValidationResult<TDocumentType extends string, TEntity extends IndexedDbRecord<TDocumentType>> {
    propertyName: keyof TEntity;
    ok: boolean;
    error: string;
    entity: TEntity
}

const dataStoreName = "data";

export const validateAttachedEntity = <TDocumentType extends string, TEntity extends IndexedDbRecord<TDocumentType>>(entity: TEntity) => {

    const properties: (keyof TEntity)[] = ["_id", "_timestamp", "DocumentType"];

    return properties.map(w => {
        const value = entity[w];
        const result: IValidationResult<TDocumentType, TEntity> = {
            ok: true,
            propertyName: w,
            error: "",
            entity
        };

        if (value == null) {
            result.ok = false;
            result.error = `Property cannot be null or undefined.  Property: ${String(w)}, Entity: ${JSON.stringify(entity)}`
            return result;
        }

        return result;
    })
}

export class IndexedDbPlugin<TDocumentType extends string, TEntityBase extends IndexedDbRecord<TDocumentType>, TDbPluginOptions extends IDbPluginOptions = IDbPluginOptions> implements IDbPlugin<TDocumentType, TEntityBase, "_id" | "_timestamp"> {

    protected readonly options: TDbPluginOptions;
    readonly idPropertyName = "_id";

    readonly types = {
        exclusions: "" as "_id" | "_timestamp"
    }

    constructor(options: TDbPluginOptions) {
        this.options = options;
    }

    protected async createDb() {
        const idPropertyName = this.idPropertyName;
        return await openDB(this.options.dbName, 1, {
            upgrade(db, oldVersion, newVersion, transaction) {

                db.createObjectStore(dataStoreName, {
                    keyPath: idPropertyName
                });
            },
            blocked(currentVersion, blockedVersion, event) {
                console.log(`Blocked: ${currentVersion}, Blocked Version: ${blockedVersion}, Event:`, event)
            },
            blocking(currentVersion, blockingVersion, event) {
                console.log(`Blocking: ${currentVersion}, Blocking Version: ${blockingVersion}, Event:`, event)
            },
            terminated() {
                console.log(`Terminated`)
            }
        });
    }

    async doWork<T>(mode: "readonly" | "readwrite" | "versionchange", action: (db: IDBPTransaction<unknown, ["data"], typeof mode>) => Promise<T>) {
        const db = await this.createDb();

        const transaction = db.transaction(dataStoreName, mode);

        const result = await action(transaction);
        await transaction.done
        db.close();

        return result;
    }

    async destroy() {
        //return await this.doWork(w => w.destroy(), false);
    }

    async all(payload?: IQueryParams<TDocumentType>) {
        const result = await this.doWork('readonly', async w => {
            try {

                const docs: TEntityBase[] = await w.store.getAll();
                debugger;
                return docs;
            } catch (e) {

                if ('message' in e && e.message.includes("database is closed")) {
                    throw e;
                }

                return Promise.resolve<TEntityBase[]>([]);
            }
        });

        return result;
    }

    async query(request: PouchDB.Find.FindRequest<TEntityBase>) {
        return await this.all();
    }

    async getStrict(_: TDocumentType, ...ids: string[]) {
        if (ids.length === 0) {
            return [];
        }

        return await this.doWork('readonly', w => w.store.getAll(ids));

        // return result.results.map(w => {
        //     const result = w.docs[0];

        //     if ('error' in result) {
        //         throw new Error(`docid: ${w.id}, error: ${JSON.stringify(result.error, null, 2)}`)
        //     }

        //     return result.ok as TEntityBase;
        // });
    }

    async get(_: TDocumentType, ...ids: string[]) {
        return await this.getStrict(_, ...ids);
    }

    // async putRecord(record: TEntityBase) {
    //     return await this.doWork(async w => {
    //         const result = await w.put(dataStoreName, record, record._id);
    //         w.close();
    //         return result;
    //     });
    // }

    async bulkOperations(operations: { adds: TEntityBase[]; removes: TEntityBase[]; updates: TEntityBase[]; }, _: Transactions) {
        try {
            const { adds, removes, updates } = operations;
            debugger;
            const response = await this.doWork("readwrite", async w => {
                debugger;
                const addResult = await Promise.all(adds.map(item => w.store.put({ ...item, _timestamp: Date.now() })));
                const updateResult = await Promise.all(updates.map(item => w.store.put(item)));
                const removeResult = await Promise.all(removes.map(item => w.store.delete(item._id)));
                debugger;
            });

            return null as any


        } catch (e: any) {

        }
    }

    protected formatBulkDocsResponse(response: (PouchDB.Core.Response | PouchDB.Core.Error)[]) {
        const result: IBulkOperationsResponse = {
            errors: {},
            successes: {},
            errors_count: 0,
            successes_count: 0
        };

        for (const item of response) {
            if ('error' in item) {
                const error = item as PouchDB.Core.Error;

                if (!error.id) {
                    continue;
                }

                result.errors_count += 1;
                result.errors[error.id] = {
                    id: error.id,
                    ok: false,
                    error: error.message,
                    rev: error.rev
                } as IBulkOperation;
                continue;
            }

            const success = item as PouchDB.Core.Response;

            result.successes_count += 1;
            result.successes[success.id] = {
                id: success.id,
                ok: success.ok,
                rev: success.rev
            } as IBulkOperation;
        }

        return result;
    }

    async prepareAttachments(...entities: TEntityBase[]) {
        const validationFailures = entities.map(w => validateAttachedEntity<TDocumentType, TEntityBase>(w)).flat().filter(w => w.ok === false);
        const result: { ok: boolean, docs: TEntityBase[], errors: string[] } = {
            ok: true,
            docs: [],
            errors: []
        }

        if (validationFailures.length > 0) {
            result.errors = validationFailures.map(w => w.error);
            result.ok = false;
            return result;
        }

        const entityMap = entities.reduce((a, v) => {

            if (a[v.DocumentType] == null) {
                a[v.DocumentType] = [];
            }

            a[v.DocumentType].push(v);

            return a;

        }, {} as { [key in TDocumentType]: TEntityBase[] })
        const foundAll = await Promise.all(Object.keys(entityMap).map((w: TDocumentType) => this.getStrict(w, ...entityMap[w].map(x => x._id))));
        const found = foundAll.reduce((a, v) => a.concat(v), []);
        const foundDictionary = found.reduce((a, v) => ({ ...a, [v._id]: v._timestamp }), {} as { [key: string]: any });
        result.docs = entities.map(w => ({ ...w, _timestamp: foundDictionary[w._id] } as TEntityBase));

        return result;
    }

    private _isAdditionAllowed(entity: TEntityBase) {
        const indexableEntity = entity as any;

        // cannot add an entity that already has a rev, means its in the database already
        if (!!indexableEntity["_timestamp"]) {
            return {
                ok: false,
                error: "Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity"
            }
        }

        return { ok: true };
    }

    private _isRemovalAllowed(entity: TEntityBase) {
        const indexableEntity = entity as any;

        // cannot add an entity that already has a rev, means its in the database already
        if (!indexableEntity["_timestamp"]) {
            return {
                ok: false,
                error: "Cannot remove entity that is not in the database, please supply _timestamp property"
            }
        }

        return { ok: true };
    }

    isOperationAllowed(entity: TEntityBase, operation: DbPluginOperations) {

        const map = {
            "add": this._isAdditionAllowed,
            "remove": this._isRemovalAllowed
        }

        const cb = map[operation]

        if (cb == null) {
            return { ok: true }
        }

        return cb(entity);
    }

    prepareDetachments(...entities: TEntityBase[]): { ok: boolean; errors: string[]; docs: TEntityBase[]; } {
        const validationFailures = entities.map(w => validateAttachedEntity<TDocumentType, TEntityBase>(w)).flat().filter(w => w.ok === false);
        const result: { ok: boolean, docs: TEntityBase[], errors: string[] } = {
            ok: true,
            docs: [],
            errors: []
        }

        if (validationFailures.length > 0) {
            result.errors = validationFailures.map(w => w.error);
            result.ok = false;
            return result;
        }

        result.docs = entities;
        return result;
    }

    enrichGenerated(response: IBulkOperationsResponse, entity: TEntityBase): TEntityBase {
        const found = response.successes[entity._id];

        if (found && found.ok === true) {
            return { ...entity, _timestamp: found.rev }
        }

        return entity;
    }

    enrichRemoval(entity: TEntityBase) {
        return { ...entity } as TEntityBase
    }
}