import PouchDB from 'pouchdb';
import { IDbPlugin, IBulkOperationsResponse, IBulkOperation, IQueryParams, DbPluginOperations, Transactions } from '@agrejus/db-framework';
import findAdapter from 'pouchdb-find';
import memoryAdapter from 'pouchdb-adapter-memory';
import { validateAttachedEntity } from './validator';
import { IPouchDbPluginOptions, PouchDbRecord } from './types';
import { Transaction } from './Transaction';

PouchDB.plugin(findAdapter);
PouchDB.plugin(memoryAdapter);

export class PouchDbPlugin<TDocumentType extends string, TEntityBase extends PouchDbRecord<TDocumentType>, TDbPluginOptions extends IPouchDbPluginOptions = IPouchDbPluginOptions> implements IDbPlugin<TDocumentType, TEntityBase, "_id" | "_rev"> {

    protected readonly options: TDbPluginOptions;
    readonly idPropertyName = "_id";
    readonly skip: (keyof TEntityBase)[] = ["_id", "_rev"];

    readonly types = {
        exclusions: "" as "_id" | "_rev"
    }

    constructor(options: TDbPluginOptions) {
        this.options = options;
    }

    protected createDb() {
        const { dbName, resolveConflicts, ...options } = this.options
        return new PouchDB<TEntityBase>(this.options.dbName, options);
    }

    private async _processTransaction<T>(action: (db: PouchDB.Database<TEntityBase>) => Promise<T>): Promise<{ result: T, db: PouchDB.Database<TEntityBase> }> {
        return new Promise<{ result: T, db: PouchDB.Database<TEntityBase> }>((resolve, reject) => {
            const transaction = new Transaction(resolve, reject, action, this.createDb.bind(this));
            transaction.execute();
        });
    }

    async doWork<T>(action: (db: PouchDB.Database<TEntityBase>) => Promise<T>, shouldClose: boolean = true) {
        const { result, db } = await this._processTransaction(action);

        if (shouldClose) {
            await db.close();
        }

        return result;
    }

    async destroy() {
        return await this.doWork(w => w.destroy(), false);
    }

    async all(payload?: IQueryParams<TDocumentType>) {
        const result = await this.doWork(w => {
            try {
                const findOptions: PouchDB.Find.FindRequest<TEntityBase> = {
                    selector: {},
                }

                if (payload != null) {
                    findOptions.selector = payload
                }

                return w.find(findOptions) as Promise<PouchDB.Find.FindResponse<TEntityBase>>
            } catch (e) {

                if ('message' in e && e.message.includes("database is closed")) {
                    throw e;
                }

                return Promise.resolve<PouchDB.Find.FindResponse<TEntityBase>>({
                    docs: []
                });
            }
        });

        return result.docs as TEntityBase[];
    }

    async query(request: PouchDB.Find.FindRequest<TEntityBase>) {
        return await this.doWork(w => w.find(request))
    }

    async getStrict(_: TDocumentType, ...ids: string[]) {
        if (ids.length === 0) {
            return [];
        }

        const result = await this.doWork(w => w.bulkGet({ docs: ids.map(x => ({ id: x })) }));

        return result.results.map(w => {
            const result = w.docs[0];

            if ('error' in result) {
                throw new Error(`docid: ${w.id}, error: ${JSON.stringify(result.error, null, 2)}`)
            }

            return result.ok as TEntityBase;
        });
    }

    async get(_: TDocumentType, ...ids: string[]) {
        try {

            const result = await this.doWork(w => w.find({
                selector: {
                    _id: {
                        $in: ids
                    }
                }
            }), false);

            return result.docs as TEntityBase[];
        } catch (e) {

            if ('message' in e && e.message.includes("database is closed")) {
                throw e;
            }

            return [] as TEntityBase[];
        }
    }

    async bulkOperations(operations: { adds: TEntityBase[]; removes: TEntityBase[]; updates: TEntityBase[]; }, _: Transactions) {
        return new Promise<IBulkOperationsResponse>(async (resolve, reject) => {
            try {
                const { adds, removes, updates } = operations;

                const response = await this.doWork(w => w.bulkDocs([...removes, ...adds, ...updates]));
                const result = this.formatBulkDocsResponse(response);

                if (this.options.resolveConflicts === true && result.errors_count > 0) {

                    const updateConflicts = Object.values(result.errors).filter(w => w.error?.toLowerCase().includes("document update conflict"));

                    if (updateConflicts.length === 0) {
                        resolve(result)
                        return;
                    }

                    // delete errors from the original response
                    for (const conflict of updateConflicts) {
                        delete result.errors[conflict.id];
                        result.errors_count -= 1;
                    }

                    // get all items from the database
                    const updatesMap = updates.reduce((a, v) => ({ ...a, [v._id]: v }), {} as { [id: string]: TEntityBase })
                    const idMap = updateConflicts.reduce((a, v) => {

                        const document = updatesMap[v.id];

                        if (a[document.DocumentType] == null) {
                            a[document.DocumentType] = []
                        }

                        a[document.DocumentType].push(document._id)


                        return a;
                    }, {} as { [documentType in TDocumentType]: string[] });


                    const allUnconflictedSets = await Promise.all(Object.keys(idMap).map((w: TDocumentType) => this.get(w, ...idMap[w])));
                    const unconflictedItems = allUnconflictedSets.reduce((a, v) => a.concat(v), []);

                    if (unconflictedItems.length === 0) {
                        resolve(result)
                        return;
                    }

                    // pluck the revs
                    const revsMap = unconflictedItems.reduce((a, v) => ({ ...a, [v._id]: v._rev }), {} as { [id: string]: string });
                    const conflictUpdates: TEntityBase[] = [];

                    for (const id in updatesMap) {

                        if (revsMap[id] == null) {
                            continue;
                        }

                        const conflictedUpdate = updatesMap[id];

                        if (conflictedUpdate == null) {
                            result.errors[id] = {
                                ok: false,
                                id,
                                error: "Conflicted doc not found in database"
                            }
                            result.errors_count += 1;
                            continue;
                        }

                        (conflictedUpdate as any)._rev = revsMap[id];

                        conflictUpdates.push(conflictedUpdate)
                    }

                    // retry updates
                    const conflictUpdateResponse = await this.doWork(w => w.bulkDocs(conflictUpdates));
                    const conflictUpdateResult = this.formatBulkDocsResponse(conflictUpdateResponse);

                    result.errors = { ...result.errors, ...conflictUpdateResult.errors };
                    result.errors_count += conflictUpdateResult.errors_count;

                    result.successes = { ...result.successes, ...conflictUpdateResult.successes };
                    result.successes_count += conflictUpdateResult.successes_count;
                }

                resolve(result);
            } catch (e: any) {
                reject(e);
            }
        });
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
        const foundAll = await Promise.all(Object.keys(entityMap).map((w: TDocumentType) => this.getStrict(w, ...entityMap[w].map(w => w._id))));
        const found = foundAll.reduce((a, v) => a.concat(v), []);
        const foundDictionary = found.reduce((a, v) => ({ ...a, [v._id]: v._rev }), {} as { [key: string]: any });
        result.docs = entities.map(w => ({ ...w, _rev: foundDictionary[w._id] } as TEntityBase));

        return result;
    }

    private _isAdditionAllowed(entity: TEntityBase) {
        const indexableEntity = entity as any;

        // cannot add an entity that already has a rev, means its in the database already
        if (!!indexableEntity["_rev"]) {
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
        if (!indexableEntity["_rev"]) {
            return {
                ok: false,
                error: "Cannot remove entity that is not in the database, please supply _rev property"
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
            return { ...entity, _rev: found.rev }
        }

        return entity;
    }

    enrichRemoval(entity: TEntityBase) {
        return { ...entity } as TEntityBase
    }
}