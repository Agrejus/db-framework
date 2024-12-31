// @ts-nocheck

import PouchDB from 'pouchdb';
import { CompiledSchema, EntityChanges, EntityModificationResult, Expression, IDbPlugin, IdType, NonNullEntity, toMap } from '@agrejus/db-framework-core';
import { toMango } from './expression/resolver';
import findAdapter from 'pouchdb-find';

PouchDB.plugin(findAdapter);

export class PouchDbPlugin implements IDbPlugin {

    private readonly _name: string;
    private readonly _options?: PouchDB.Configuration.DatabaseConfiguration;

    constructor(name: string, options?: PouchDB.Configuration.DatabaseConfiguration) {
        this._name = name;
        this._options = options;
    }

    private _identityBulkOperations<T extends {}>(operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void): void {
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

                    if (error) {
                        errors.push(error);
                    }

                    const ids: IdType[] = [];
                    for (let i = 0; i < response.length; i++) {
                        const item = response[i];

                        if ("error" in item) {

                            const reason = item.reason ?? item.error;

                            if (reason) {
                                errors.push(reason.toString())
                            }
                            
                            continue;
                        }

                        ids.push(item.id);
                    }

                    db.bulkGet<T>({
                        docs: ids.map(w => ({ id: w as string }))
                    }, (error, bulkGetResponse) => {
 
                        if (error) {
                            errors.push(error);
                        }

                        for (let i = 0; i < bulkGetResponse.results.length; i++) {
                            const item = bulkGetResponse.results[i];
                            if ("docs" in item && "id" in item && item.docs.length > 0) {
                                const doc = item.docs[0];
                                if ("ok" in doc) {
                                    if (removesMap.has(item.id)) {
                                        result.removedCount += 1;
                                        continue;
                                    }

                                    if (updatesMap.has(item.id)) {
                                        result.updates.push(doc.ok as any);
                                        continue;
                                    }

                                    result.adds.push(doc.ok as any);
                                }
                                continue;
                            }

                        }

                        d(result, errors.length > 0 ? errors : null)
                    });
                });
            } catch (e) {
                debugger;
                d(result, [e, ...errors])
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

                    for (let i = 0; i < response.length; i++) {
                        const item = response[i];

                        if ("error" in item) {

                            const reason = item.reason ?? item.error;

                            if (reason) {
                                errors.push(reason.toString())
                            }
                            continue;
                        }

                        if (removesMap.has(item.id)) {
                            result.removedCount += 1;
                            continue;
                        }

                        if (updatesMap.has(item.id)) {
                            result.updates.push({
                                _id: item.id,
                                _rev: item.rev
                            } as any);
                            continue;
                        }

                        result.adds.push({
                            _id: item.id,
                            _rev: item.rev
                        } as any);
                    }

                    d(result, errors.length > 0 ? errors : null)

                });
            } catch (e) {
                d(result, [e, ...errors])
            }
        }, done);
    }

    bulkOperations<TEntity extends {}>(
        schema: CompiledSchema<TEntity>, 
        operations: EntityChanges<TEntity>,
        done: (result: EntityModificationResult<TEntity>, error?: any) => void) {

        if (schema.idPropertyNames.length > 1) {
            throw new Error("PouchDB cannot have more than one key per document.  Only '_id' is allowed to be the key")
        }

        if (schema.hasIdentityKeys === true) {
            this._identityBulkOperations<TEntity>(operations, done);
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
        this._doWork((w, d) => {
            w.destroy(null, d);
        }, done);
    }

    query<TEntity extends {}>(schema: CompiledSchema<TEntity>, expression: Expression, options: QueryOptions, done: (entities: NonNullEntity<TEntity>[], error?: any) => void): void {
        const selector = toMango(expression);
        this._doWork((w, d) => {
            w.find({
                selector: selector
            }, (error, result) => {
                d(result.docs as NonNullEntity<TEntity>[], error)
            });
        }, done);
    }

    all<TEntity extends {}>(schema: CompiledSchema<TEntity>, done: (entities: NonNullEntity<TEntity>[], error?: any) => void): void {
        this._doWork((w, d) => {
            w.find({
                selector: {
                    documentType: schema.tableName
                },
                limit: 0
            }, (error, result) => {
                d(result.docs as NonNullEntity<TEntity>[], error)
            });
        }, done);
    }

    get<TEntity extends {}>(schema: CompiledSchema<TEntity>, ids: IdType[], done: (entities: NonNullEntity<TEntity>[], error?: any) => void): void {
        this._doWork((w, d) => {
            w.find({
                selector: {
                    documentType: schema.tableName
                },
                limit: 0
            }, (error, result) => {
                d(result.docs as NonNullEntity<TEntity>[], error)
            });
        }, done);
    }
}