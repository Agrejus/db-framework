import PouchDB from 'pouchdb';
import { CompiledSchema, EntityChanges, EntityModificationResult, Expression, IDbPlugin, IdType } from '@agrejus/db-framework-core';
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

    bulkOperations<T extends {}>(schema: CompiledSchema<T>, operations: EntityChanges<T>, resolve: (result: EntityModificationResult<T>) => void, reject: (error?: any) => void): void {
        this.doWork((w, res, rej) => {
            try {

                const { adds } = operations;
                const result: EntityModificationResult<T> = {
                    adds: [],
                    removedCount: 0,
                    updates: []
                }
                const errors: string[] = [];

                w.bulkDocs([...adds], null, (error, response) => {
        
                    if (error) {
                        rej(error);
                        return;
                    }

                    const ids: IdType[] = [];
                    response.forEach(w => {
    
                        if ("error" in w && "id" in w) {
    
                            const reason = w.reason ?? w.error;
    
                            if (reason) {
                                errors.push(reason.toString())
                            }
                            return;
                        }
    
                        if (w.id) {
                            ids.push(w.id);
                        }
                    });

                    if (errors.length > 0) {
                        rej(errors.join('\r\n'))
                        return;
                    }
    
                    w.bulkGet<T>({
                        docs: ids.map(w => ({ id: w as string }))
                    }, (error, bulkGetResponse) => {

                        if (error) {
                            rej(error);
                            return;
                        }

                        result.adds = bulkGetResponse.results.map(x => {

                            if ("ok" in x.docs[0]) {
                                return x.docs[0].ok;
                            }
                             return null
                        }).filter(w => w != null);
    
                        res(result);
                    });
    
                });
            } catch (e) {
                rej(e)
            }
        }, resolve, reject);
    }

    doWork<TResult, TEntity>(action: (db: PouchDB.Database<TEntity>, resolve: (result: TResult) => void, reject: (error?: any) => void) => void, resolve: (result: TResult) => void, reject: (error?: any) => void, shouldClose: boolean = true) {
        const db = new PouchDB<TEntity>(this._name, this._options);

        action(db, result => {
     
            if (shouldClose) {
                db.close(() => resolve(result));
                return
            }

            resolve(result)
        }, error => {
 
            if (shouldClose) {
                db.close(() => reject(error));
                return
            }

            reject(error)
        })
    }

    destroy(resolve: () => void, reject: (error?: any) => void): void {
        this.doWork(w => {
            w.destroy(null, (e) => {
                if (e) {
                    reject(e);
                    return;
                }

                resolve();
            });
        }, resolve, reject);
    }

    query<TEntity extends {}>(expression: Expression, resolve: (entities: TEntity[]) => void, reject: (error?: any) => void): void {
        const selector = toMango(expression);
        this.doWork((w, res, rej) => {
            w.find({
                selector: selector
            }, (error, result) => {

                if (error) {
                    rej(error);
                    return;
                }

                res((result.docs as any) as TEntity[])
            });
        }, resolve, reject);
    }

    all<TEntity extends {}>(tableName: string, resolve: (entities: TEntity[]) => void, reject: (error?: any) => void): void {
        this.doWork((w, res, rej) => {
            w.find({
                selector: {
                    documentType: tableName
                }
            }, (error, result) => {

                if (error) {
                    rej(error);
                    return;
                }

                res((result.docs as any) as TEntity[])
            });
        }, resolve, reject);
    }

    get<TEntity extends {}>(tableName: string, ids: string[], resolve: (entities: TEntity[]) => void, reject: (error?: any) => void): void {
        this.doWork((w, res, rej) => {
            w.find({
                selector: {
                    documentType: tableName
                }
            }, (error, result) => {

                if (error) {
                    rej(error);
                    return;
                }

                res((result.docs as any) as TEntity[])
            });
        }, resolve, reject);
    }
}