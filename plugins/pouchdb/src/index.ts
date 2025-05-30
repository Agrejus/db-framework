import PouchDB from 'pouchdb';
import { CompiledSchema, DataTranslator, DbPluginBulkOperationsEvent, DbPluginQueryEvent, EntityChanges, EntityModificationResult, IDbPlugin, IQuery, JsonTranslator, Query, SyncronousQueue, SyncronousUnitOfWork, toMap } from '@agrejus/db-framework-core';

// PouchDB cannot process operations asyncronously, we need a queue so we don't lock things up
const queue = new SyncronousQueue();

// PouchDB uses allDocs under the hood if no index specified.  If we have a lot of docs this is a problem.  
// We need to keep track of the slowest queries and create indexes for the top 10
// Use Map/Reduce for the rest?

// Query Types
// Memory Optimized -> Map/Reduce (Slower)
// Default -> No Index Specified then all docs (Fast)
type PouchDBPluginOptions = PouchDB.Configuration.DatabaseConfiguration & {
    queryType?: "default" | "memory-optimized" | "experimental"
}

export class PouchDbPlugin implements IDbPlugin {

    private readonly _name: string;
    private readonly _options?: PouchDBPluginOptions;

    constructor(name: string, options?: PouchDBPluginOptions) {
        this._name = name;
        this._options = options;
    }

    private _identityBulkOperations<T extends {}>(operations: EntityChanges<T>, done: (result: { docs: T[], removesMap: Map<string, T>, updatesMap: Map<string, T> }, error?: any) => void): void {
        const errors: any[] = [];

        this._doWork((db, d) => {
            try {

                const { adds, removes, updates } = operations;
                const updatedDocuments = [...updates].map(w => w[1].doc);
                const removesMap = toMap(removes, w => (w as any)._id);
                const updatesMap = toMap(updatedDocuments, w => (w as any)._id);

                db.bulkDocs([...adds, ...removes.map(w => ({ _id: (w as any)._id, _rev: (w as any)._rev, _deleted: true })), ...updatedDocuments], null, (error, response) => {

                    if (error) {
                        errors.push(error);
                    }

                    d({ docs: response?.map(w => w as T), updatesMap: updatesMap as any, removesMap: removesMap as any }, errors.length > 0 ? errors : null);
                });
            } catch (e) {
                d({ docs: [], updatesMap: new Map(), removesMap: new Map() }, [e, ...errors])
            }
        }, done);
    }

    private _defaultBulkOperations<T extends {}>(operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void): void {

        const result: EntityModificationResult<T> = {
            adds: [],
            removedCount: 0,
            updates: []
        }
        const errors: any[] = [];

        this._doWork((db, d) => {
            try {

                const { adds, removes, updates } = operations;

                const updatedDocuments = [...updates].map(w => w[1].doc);
                const removesMap = toMap(removes, w => (w as any)._id);
                const updatesMap = toMap(updatedDocuments, w => (w as any)._id);

                db.bulkDocs([...adds, ...removes.map(w => ({ _id: (w as any)._id, _rev: (w as any)._rev, _deleted: true })), ...updatedDocuments], null, (error, response) => {

                    if (error != null) {
                        errors.push(error)
                    }

                    response.forEach(item => {
                        if ("error" in item) {

                            const reason = item.reason ?? item.error;

                            if (reason) {
                                errors.push(reason.toString())
                            }
                            return;
                        }

                        if (removesMap.has(item.id)) {
                            result.removedCount += 1;
                            return;
                        }

                        if (updatesMap.has(item.id)) {
                            result.updates.push({
                                _id: item.id,
                                _rev: item.rev
                            } as any);
                            return;
                        }

                        result.adds.push({
                            _id: item.id,
                            _rev: item.rev
                        } as any);
                    })

                    d(result, errors.length > 0 ? errors : null)

                });
            } catch (e) {
                console.error(e);
                d(result, [e, ...errors])
            }
        }, done);
    }

    private _bulkOperations<TEntity extends {}>(
        event: DbPluginBulkOperationsEvent<TEntity>,
        done: (result: EntityModificationResult<TEntity>, error?: any) => void) {

        if (event.schema.idProperties.length > 1) {
            throw new Error("PouchDB cannot have more than one key per document.  Only '_id' is allowed to be the key")
        }

        if (event.schema.hasIdentityKeys === true) {
            this._identityBulkOperations<TEntity>(event.operation, (r, e) => {

                if (e) {
                    done(null, e);
                    return;
                }

                const ids = [...r.docs.map(w => (w as any).id)];
                const result: EntityModificationResult<TEntity> = {
                    adds: [],
                    removedCount: 0,
                    updates: []
                }
                const errors: any[] = [];

                if (e) {
                    errors.push(e);
                }

                this._doWork((db, d) => {
                    db.bulkGet<TEntity>({
                        docs: ids.map(w => ({ id: w as string }))
                    }, (error, bulkGetResponse) => {

                        if (error) {
                            errors.push(error);
                        }

                        bulkGetResponse.results.forEach(item => {
                            if ("docs" in item && "id" in item && item.docs.length > 0) {
                                const doc = item.docs[0];
                                if ("ok" in doc) {
                                    if (r.removesMap.has(item.id)) {
                                        result.removedCount += 1;
                                        return;
                                    }

                                    if (r.updatesMap.has(item.id)) {
                                        result.updates.push(doc.ok as any);
                                        return;
                                    }

                                    result.adds.push(doc.ok as any);
                                }
                                return;
                            }
                        });

                        d(result, errors.length > 0 ? errors : null)
                    });
                }, done)
            });
            return;
        }

        this._defaultBulkOperations<TEntity>(event.operation, done);
    }

    private _doWork<TResult, TEntity>(work: (db: PouchDB.Database<TEntity>, done: (result: TResult, error?: any) => void) => void, done: (result: TResult, error?: any) => void, shouldClose: boolean = true) {
        const db = new PouchDB<TEntity>(this._name, this._options);

        work(db, (result, error) => {

            if (shouldClose) {
                db.close(() => done(result, error));
                return
            }

            done(result, error);
        })
    }

    destroy(done: (error?: any) => void): void {
        // this needs to be queued too
        this._doWork((w, d) => {
            w.destroy(null, d);
        }, done);
    }


    bulkOperations<TEntity extends {}>(
        event: DbPluginBulkOperationsEvent<TEntity>,
        done: (result: EntityModificationResult<TEntity>, error?: any) => void) {

        const unitOfWork: SyncronousUnitOfWork = (d) => this._bulkOperations(event, (r, e) => {
            d();
            done(r, e)
        })

        queue.enqueue(unitOfWork.bind(this));
    }

    query<TEntity extends {}, TShape extends unknown = TEntity>(event: DbPluginQueryEvent<TEntity, TShape>, done: (result: TShape, error?: any) => void): void {
        const unitOfWork: SyncronousUnitOfWork = (d) => this._query<TEntity, TShape>(event, (r, e) => {
            d();
            done(r, e)
        })

        queue.enqueue(unitOfWork.bind(this));
    }

    private _translate<TEntity extends {}, TShape extends unknown = TEntity>(result: PouchDB.Find.FindResponse<unknown>, translator: DataTranslator<TEntity, TShape>) {

        if (translator instanceof JsonTranslator) {
            return translator.translate(result.docs);
        }

        return translator.translate(result);
    }

    protected onGetIndex<TEntity extends {}, TShape extends unknown = TEntity>(_: IQuery<TEntity, TShape>, __: PouchDB.Find.FindRequest<unknown>, done: (result: null | string | [string, string]) => void) {
        done(null);
    }

    private _queryDefault<TEntity extends {}, TShape extends unknown = TEntity>(event: DbPluginQueryEvent<TEntity, TShape>, done: (result: TShape, error?: any) => void): void {
        const jsonTranslator = new JsonTranslator<TEntity, TShape>(event.operation);
        this._doWork((w, d) => {
            w.allDocs({
                include_docs: true
            }).then(response => {


                const translated = this._translate({
                    docs: response.rows.map(w => w.doc)
                }, jsonTranslator);
                d(translated);
            }).catch(error => {
                d(null, error);
            });
        }, done);
    }

    private _queryMemoryOptimized<TEntity extends {}, TShape extends unknown = TEntity>(event: DbPluginQueryEvent<TEntity, TShape>, done: (result: TShape, error?: any) => void): void {
        const jsonTranslator = new JsonTranslator<TEntity, TShape>(event.operation);
        this._doWork((w, d) => {
            w.query((doc, emit) => {
                if (typeof doc === "object" && "_id" in doc && jsonTranslator.satisfies(doc)) {
                    emit(doc._id, doc);
                }
            }, (error, response) => {

                if (error != null) {
                    d(null, error);
                    return;
                }

                const translated = this._translate({
                    docs: response.rows.map(w => w.value)
                }, jsonTranslator);
                d(translated);
            });
        }, done);
    }


    private _query<TEntity extends {}, TShape extends unknown = TEntity>(event: DbPluginQueryEvent<TEntity, TShape>, done: (result: TShape, error?: any) => void): void {

        if (this._options?.queryType === "memory-optimized") {
            this._queryMemoryOptimized<TEntity, TShape>(event, done);
            return
        }

        this._queryDefault<TEntity, TShape>(event, done);
    }
}