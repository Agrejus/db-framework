import PouchDB from 'pouchdb';
import { CompiledSchema, DataTranslator, EntityChanges, EntityModificationResult, IDbPlugin, IQuery, JsonTranslator, Query, SyncronousQueue, SyncronousUnitOfWork, toMap } from '@agrejus/db-framework-core';
import { setQueryOptions, toMango } from './expressionResolver';
import findAdapter from 'pouchdb-find';
import { PouchDBTranslator } from './translator';

PouchDB.plugin(findAdapter);

// PouchDB cannot process operations asyncronously, we need a queue so we don't lock things up
const queue = new SyncronousQueue();

export { toMango, setQueryOptions };

export class PouchDbPlugin implements IDbPlugin {

    private readonly _name: string;
    private readonly _options?: PouchDB.Configuration.DatabaseConfiguration;

    constructor(name: string, options?: PouchDB.Configuration.DatabaseConfiguration) {
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

                    d({ docs: response.map(w => w as T), updatesMap: updatesMap as any, removesMap: removesMap as any }, errors.length > 0 ? errors : null);
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
        schema: CompiledSchema<TEntity>,
        operations: EntityChanges<TEntity>,
        done: (result: EntityModificationResult<TEntity>, error?: any) => void) {

        if (schema.idProperties.length > 1) {
            throw new Error("PouchDB cannot have more than one key per document.  Only '_id' is allowed to be the key")
        }

        if (schema.hasIdentityKeys === true) {
            this._identityBulkOperations<TEntity>(operations, (r, e) => {
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

        this._defaultBulkOperations<TEntity>(operations, done);
    }

    private _doWork<TResult, TEntity>(action: (db: PouchDB.Database<TEntity>, done: (result: TResult, error?: any) => void) => void, done: (result: TResult, error?: any) => void, shouldClose: boolean = true) {
        const db = new PouchDB<TEntity>(this._name, this._options);

        action(db, (result, error) => {

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
        schema: CompiledSchema<TEntity>,
        operations: EntityChanges<TEntity>,
        done: (result: EntityModificationResult<TEntity>, error?: any) => void) {

        const unitOfWork: SyncronousUnitOfWork = (d) => this._bulkOperations(schema, operations, (r, e) => {
            d();
            done(r, e)
        })

        queue.enqueue(unitOfWork.bind(this));
    }

    query<TEntity extends {}, TShape extends unknown = TEntity>(query: IQuery<TEntity, TShape>, done: (result: TShape, error?: any) => void): void {
        const unitOfWork: SyncronousUnitOfWork = (d) => this._query<TEntity, TShape>(query, (r, e) => {
            d();
            done(r, e)
        })

        queue.enqueue(unitOfWork.bind(this));
    }

    private _find<TEntity extends {}, TShape extends unknown = TEntity>(request: PouchDB.Find.FindRequest<unknown>, translator: DataTranslator<TEntity, TShape>, query: IQuery<TEntity, TShape>, done: (result: TShape, error?: any) => void) {
        this._doWork((w, d) => {
            this.onGetIndex(query, request, (index => {

                if (index != null) {
                    request.use_index = index;
                }

                w.find(request, (error, result) => {


                    if (error != null && "message" in error && typeof error.message === "string") {
                        const match = error.message.match(/Cannot sort on field\(s\) "([^"]+)" when using the default index/);

                        // fallback
                        if (match && match[1]) {

                            console.warn("PouchDB sort error, falling back to memory sorting by selecting all data", error);
                            const allRequest: PouchDB.Find.FindRequest<unknown> = {
                                selector: {}
                            };
                            const all = Query.all<TEntity, TShape>(query.schema);
                            setQueryOptions(all.options, allRequest);

                            // Fallback to memory sorting/filtering, force Json Translator use
                            const jsonTranslator = new JsonTranslator<TEntity, TShape>(query);

                            w.find(allRequest, (error, result) => {

                                if (error != null) {
                                    d(null, error);
                                    return;
                                }

                                const translated = this._translate(result, jsonTranslator);
                                d(translated);
                            });
                            return;
                        }
                        // let this fall through
                    }

                    // use passed in translator
                    const translated = this._translate(result, translator);

                    d(translated, error);
                });

            }));
        }, done);
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

    private _query<TEntity extends {}, TShape extends unknown = TEntity>(query: IQuery<TEntity, TShape>, done: (result: TShape, error?: any) => void): void {

        const request: PouchDB.Find.FindRequest<unknown> = {
            selector: {}
        };
        const jsonTranslator = new JsonTranslator<TEntity, TShape>(query);

        if (query.options.sort != null && query.options.sort.length > 1) {
            console.warn("PouchDB cannot internally handle more than one sort operation, falling back to memory sorting by selecting all data");
            const all = Query.all<TEntity, TShape>(query.schema);
            setQueryOptions(all.options, request);

            this._find(request, jsonTranslator, query, done);
            return;

        }

        if (query.expression == null) {

            setQueryOptions(query.options, request);

            this._find(request, jsonTranslator, query, done);
            return;
        }

        request.selector = toMango(query.expression);

        setQueryOptions(query.options, request);

        // PouchDB did all of the filtering for us, let's translate the response
        const pouchDbTranslator = new PouchDBTranslator<TEntity, TShape>(query);

        this._find(request, pouchDbTranslator, query, done);
    }
}