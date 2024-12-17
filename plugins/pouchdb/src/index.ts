import PouchDB from 'pouchdb';
import { CompiledSchema, EntityChanges, EntityModificationResult, Expression, IDbPlugin, IdType } from '@agrejus/db-framework-core';
import { toMango } from './expression/resolver';
import findAdapter from 'pouchdb-find';
import { performance } from 'perf_hooks';

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

        this.doWork((w, d) => {
            try {

                // if the schema hash any identitys, then we need to reselect, otherwise we can skip and be faster!

                const { adds } = operations;

                w.bulkDocs([...adds], null, (error, response) => {

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
                            return;
                        }

                        ids.push(item.id);
                    }

                    w.bulkGet<T>({
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
                                    result.adds.push(doc.ok as any)
                                }
                                continue;
                            }

                        }
                        d(result, errors.length > 0 ? errors : null)
                    });

                });
            } catch (e) {
                d(result, errors)
            }
        }, done);
    }

    private _defaultBulkOperations<T extends {}>(operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void): void {

        const result: EntityModificationResult<T> = {
            adds: [],
            removedCount: 0,
            updates: []
        }

        this.doWork((w, d) => {
            try {

                const { adds } = operations;

                const errors: any[] = [];

                w.bulkDocs([...adds], null, (error, response) => {

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
                            return;
                        }

                        result.adds.push({
                            _id: item.id,
                            _rev: item.rev
                        } as any)
                    }

                    d(result, errors.length > 0 ? errors : null)

                });
            } catch (e) {
                d(result, e)
            }
        }, done);
    }

    bulkOperations<T extends {}>(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {

        if (schema.idPropertyNames.length > 1) {
            throw new Error("PouchDB cannot have more than one key per document.  Only '_id' is allowed to be the key")
        }

        if (schema.hasIdentityKeys === true) {
            this._identityBulkOperations(operations, done);
            return;
        }

        this._defaultBulkOperations(operations, done);
    }

    doWork<TResult, TEntity>(action: (db: PouchDB.Database<TEntity>, done: (result: TResult, error?: any) => void) => void, done: (result: TResult, error?: any) => void, shouldClose: boolean = true) {
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
        this.doWork((w, d) => {
            w.destroy(null, d);
        }, done);
    }

    query<TEntity extends {}>(expression: Expression, done: (entities: TEntity[], error?: any) => void): void {
        const selector = toMango(expression);
        this.doWork((w, d) => {
            w.find({
                selector: selector
            }, (error, result) => {
                d((result.docs as any) as TEntity[], error)
            });
        }, done);
    }

    all<TEntity extends {}>(tableName: string, done: (entities: TEntity[], error?: any) => void): void {
        this.doWork((w, d) => {
            w.find({
                selector: {
                    documentType: tableName
                }
            }, (error, result) => {
                d((result.docs as any) as TEntity[], error)
            });
        }, done);
    }

    get<TEntity extends {}>(tableName: string, ids: string[], done: (entities: TEntity[], error?: any) => void): void {
        this.doWork((w, d) => {
            w.find({
                selector: {
                    documentType: tableName
                }
            }, (error, result) => {
                d((result.docs as any) as TEntity[], error)
            });
        }, done);
    }
}