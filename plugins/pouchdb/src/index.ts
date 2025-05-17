import PouchDB from 'pouchdb';
import { CompiledSchema, EntityChanges, EntityModificationResult, IDbPlugin, InferType, IQuery, JsonTranslator, Query, SyncronousQueue, SyncronousUnitOfWork, toMap } from '@agrejus/db-framework-core';
import { setQueryOptions, toMango } from './expressionResolver';
import findAdapter from 'pouchdb-find';
import { PouchDBTranslator } from './translator';

PouchDB.plugin(findAdapter);
const INDEX_NAME = "db_framework_order_index";

// PouchDB cannot process operations asyncronously, we need a queue so we don't lock things up
const queue = new SyncronousQueue();

export { toMango };

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

                this._doWork((db, d) => {
                    db.bulkGet<TEntity>({
                        docs: ids.map(w => ({ id: w as string }))
                    }, (error, bulkGetResponse) => {

                        if (error) {
                            errors.push(error);
                        }

                        if (e) {
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

    private _query<TEntity extends {}, TShape extends unknown = TEntity>(query: IQuery<TEntity, TShape>, done: (result: TShape, error?: any) => void): void {

        const request: PouchDB.Find.FindRequest<unknown> = {
            selector: {}
        };

        if (query.expression == null) {
            const jsonTranslator = new JsonTranslator<TEntity, TShape>(query);

            setQueryOptions(query.options, request);

            this._doWork((w, d) => {
                w.find(request, (error, result) => {

                    if (error != null && "message" in error && typeof error.message === "string") {
                        const match = error.message.match(/Cannot sort on field\(s\) "([^"]+)" when using the default index/);

                        if (match && match[1]) {
                            const propertyNames = match[1].split(',').map(field => field.trim());

                            this._doWork((w, d) => {
                                w.getIndexes((error, result) => {

                                    if (error != null) {
                                        d(null, error);
                                        return;
                                    }

                                    if (result.indexes.length === 0) {
                                        w.createIndex({
                                            index: {
                                                fields: propertyNames,
                                                name: INDEX_NAME
                                            }
                                        }, (error) => {

                                            if (error != null) {
                                                d(null, error);
                                                return;
                                            }

                                            w.find(request, (error, result) => {

                                                // Filter our where clauses, we are in the fallback route
                                                const filteredResult = query.filter(result.docs as TShape);

                                                d(jsonTranslator.translate(filteredResult), error)
                                            });
                                        })
                                        return;
                                    }

                                    const found = result.indexes.find(w => w.name === INDEX_NAME);

                                    if (found) {
                                        w.deleteIndex(found, (error) => {
                                            if (error != null) {
                                                d(null, error);
                                                return;
                                            }

                                            w.createIndex({
                                                index: {
                                                    fields: propertyNames,
                                                    name: INDEX_NAME
                                                }
                                            }, (error) => {

                                                if (error != null) {
                                                    d(null, error);
                                                    return;
                                                }

                                                w.find(request, (error, result) => {

                                                    // Filter our where clauses, we are in the fallback route
                                                    const filteredResult = query.filter(result.docs as TShape);

                                                    d(jsonTranslator.translate(filteredResult), error)
                                                });
                                            })
                                        })
                                        return;
                                    }

                                    w.createIndex({
                                        index: {
                                            fields: propertyNames,
                                            name: INDEX_NAME
                                        }
                                    }, (error) => {
                                        if (error != null) {
                                            d(null, error);
                                            return;
                                        }

                                        w.find(request, (error, result) => {

                                            // Filter our where clauses, we are in the fallback route
                                            const filteredResult = query.filter(result.docs as TShape);

                                            d(jsonTranslator.translate(filteredResult), error)
                                        });
                                    });
                                })
                            }, done);

                            return;
                        }
                    }

                    // Filter our where clauses, we are in the fallback route
                    const filteredResult = query.filter(result.docs as TShape);

                    d(jsonTranslator.translate(filteredResult), error)
                });
            }, done);
            return;
        }

        request.selector = toMango(query.expression);

        setQueryOptions(query.options, request);

        // PouchDB did all of the filtering for us, let's translate the response
        const pouchDbTranslator = new PouchDBTranslator<TEntity, TShape>(query);

        this._doWork((w, d) => {
            w.find(request, (error, result) => {
                d(pouchDbTranslator.translate(result), error)
            });
        }, done);

    }
}