import type { ICapacitorSqlitePlugin, CapacitorSqliteRecord, ISqliteContext, ISqliteOptions } from './definitions';
import type { IBulkOperationsResponse, IQueryParams } from '@agrejus/db-framework';

export const createBridge: (context: ISqliteContext, options: ISqliteOptions) => ICapacitorSqlitePlugin = (context: ISqliteContext, options: ISqliteOptions) => {

    const defaultSelectStatement = `SELECT key, value FROM ${options.tableName} WHERE documentType = $documentType AND key IN `;
    const defaultInsertStatement = `INSERT INTO ${options.tableName} (key, documentType, value) VALUES `;
    const defaultUpdateStatement = `UPDATE ${options.tableName} SET value = $value WHERE key = $key`;
    const defaultDeleteStatement = `DELETE FROM ${options.tableName} WHERE key IN `;
    const defaultCreateTableStatement = `CREATE TABLE IF NOT EXISTS ${options.tableName} (key TEXT PRIMARY KEY, documentType TEXT, value TEXT)`;
    const pragmaStatement = "PRAGMA synchronous=NORMAL;PRAGMA journal_mode=WAL;";
    const database = new context.Database(options.fileName);

    database.serialize(() => {
        database.run(defaultCreateTableStatement, (error) => {
            if (error != null) {
                console.error(error)
            }
        });
    });

    database.close();

    const destroy = async () => {
        const database = new context.Database(options.fileName);
        database.serialize(() => {
            database.run(`DELETE FROM ${options.tableName}`);
        });
        database.close();
    }

    const all = async <TDocumentType extends string, TDocument extends CapacitorSqliteRecord<TDocumentType>>(payload?: IQueryParams<TDocumentType>) => {
        return new Promise<TDocument[]>((resolve, reject) => {
            const database = new context.Database(options.fileName);
            if (payload?.DocumentType != null) {

                database.serialize(() => {
                    database.all(`SELECT key, value FROM ${options.tableName} WHERE documentType = $documentType`, { $documentType: payload.DocumentType }, (error, rows) => {

                        if (error != null) {
                            database.close();
                            reject(error)
                            return;
                        }

                        const result = rows.reduce((a, v) => [...a, { ...JSON.parse(v.value) as TDocument }], [] as TDocument[]);
                        database.close();
                        resolve(result);
                    });
                });
                return;
            }

            database.serialize(() => {
                database.all(`SELECT key, value FROM ${options.tableName}`, (error, rows) => {

                    if (error != null) {
                        database.close();
                        reject(error)
                        return;
                    }

                    const result = rows.reduce((a, v) => [...a, { ...JSON.parse(v.value) as TDocument }], [] as TDocument[]);
                    database.close();
                    resolve(result);
                });
            });
        });
    }

    const bulkDocs = async <TDocumentType extends string, TDocument extends CapacitorSqliteRecord<TDocumentType>>(operations: { adds: TDocument[]; removes: TDocument[]; updates: TDocument[]; }) => {

        const database = new context.Database(options.fileName);
        database.serialize(() => {

            database.run(pragmaStatement)

            database.parallelize(() => {

                // inserts
                if (operations.adds.length > 0) {
                    let insertStatement = defaultInsertStatement;
                    const insertParameters: { [key: string]: string } = {}

                    for (let i = 0; i < operations.adds.length; i++) {
                        const document = operations.adds[i]
                        const documentTypeParameter = `$documentType_${i}`;
                        const keyParameter = `$key_${i}`
                        const valueParameter = `$value_${i}`

                        let delimiter = ",";

                        if (i >= operations.adds.length - 1) {
                            delimiter = "";
                        }

                        insertStatement += `(${keyParameter}, ${valueParameter}, ${documentTypeParameter})${delimiter}`;
                        insertParameters[keyParameter] = document._id;
                        insertParameters[valueParameter] = JSON.stringify(document);
                        insertParameters[documentTypeParameter] = document.DocumentType;
                    }

                    database.run(insertStatement, insertParameters)
                }

                // removes
                if (operations.removes.length > 0) {
                    let deleteStatement = defaultDeleteStatement;
                    const deleteParameters: { [key: string]: string } = {}

                    deleteStatement += "("

                    for (let i = 0; i < operations.removes.length; i++) {
                        const document = operations.removes[i];
                        const parameterName = `$${i}`
                        let delimiter = ",";

                        if (i >= operations.removes.length - 1) {
                            delimiter = "";
                        }

                        deleteStatement += `${parameterName}${delimiter}`;
                        deleteParameters[parameterName] = document._id;
                    }

                    deleteStatement += ")"

                    database.run(deleteStatement, deleteParameters)
                }

                // updates
                if (operations.updates.length > 0) {
                    for (let i = 0; i < operations.updates.length; i++) {
                        const document = operations.updates[i];
                        database.run(defaultUpdateStatement, { $key: document._id, $value: JSON.stringify(document) })
                    }
                }
            })

        });

        database.close();

        const result: IBulkOperationsResponse = {
            errors: {},
            errors_count: 0,
            successes: operations.adds.reduce((a, v) => ({ ...a, [v._id]: v }), {}),
            successes_count: operations.adds.length
        }

        return result;
    }

    const get = async <TDocumentType extends string, TDocument extends CapacitorSqliteRecord<TDocumentType>>(_: TDocumentType, ...ids: string[]) => {
        return new Promise<TDocument[]>((resolve, reject) => {

            const getParams: { [key: string]: string } = {}

            for (let i = 0; i < ids.length; i++) {
                getParams[`$${i}`] = ids[i];
            }

            database.all(defaultSelectStatement, getParams, (error, rows) => {

                if (error != null) {
                    reject(error)
                    return;
                }


                const result = rows.reduce((a, v) => [...a, { ...JSON.parse(v.value) as TDocument }], [] as TDocument[]);
                database.close();
                resolve(result);
            })
        });
    }

    return {
        destroy,
        all,
        bulkDocs,
        get
    }
}