import { IDbPlugin, EntityModificationResult, DbPluginQueryEvent, DbPluginBulkOperationsEvent, DbPluginEvent, InferCreateType, DeepPartial, JsonTranslator } from "@agrejus/db-framework-core";
import Dexie from 'dexie';
import { convertToDexieSchema } from "./utils";

const cache = new Map<string, Record<string, string>>();

export class DexiePlugin implements IDbPlugin, Disposable {

    private readonly dbName: string;

    constructor(dbName: string) {
        this.dbName = dbName;
    }

    private _doWork<TResult, TEntity>(event: DbPluginEvent<TEntity>, work: (db: Dexie, done: (result: TResult, error?: any) => void) => void, done: (result: TResult, error?: any) => void, shouldClose: boolean = true) {
        const db = new Dexie(this.dbName);

        const stores = this.getSchemas(event);

        db.version(1).stores(stores);

        try {
            work(db, (result, error) => {

                if (shouldClose) {
                    db.close();
                }

                done(result, error);
            });
        } catch (e) {
            done(null, e);
        }
    }

    destroy(done: (error?: any) => void): void {
        const db = new Dexie(this.dbName);
        db.delete().then(done).catch(done);
    }

    bulkOperations<TEntity extends {}>(
        event: DbPluginBulkOperationsEvent<TEntity>,
        done: (result: EntityModificationResult<TEntity>, error?: any) => void) {

        if (event.schema.hasIdentityKeys === true) {
            this.identityBulkOperations(event, done);
            return;
        }

        this.defaultBulkOperations(event, done);
    }

    private async _persistIdentity<TEntity extends {}>(event: DbPluginBulkOperationsEvent<TEntity>, db: Dexie) {
        const { adds, removes, updates } = event.operation;

        const updatedDocuments = [...updates].map(w => w[1].doc);

        const collection = db.table(event.schema.collectionName);

        await collection.bulkPut(updatedDocuments);

        const ids = removes.map(x => event.schema.getIds(x));
        await collection.bulkDelete(ids)

        return await db.transaction('rw', collection, async () => Promise.all(adds.map(async x => {

            const id = await collection.add(x);

            event.schema.idProperties[0].setValue(x, id);

            return x;
        })));
    }

    private async _persistDefault<TEntity extends {}>(event: DbPluginBulkOperationsEvent<TEntity>, db: Dexie) {
        const { adds, removes, updates } = event.operation;

        const updatedDocuments = [...updates].map(w => w[1].doc);

        const collection = db.table(event.schema.collectionName);

        await collection.bulkPut(updatedDocuments);

        const ids = removes.map(x => event.schema.getIds(x));
        await collection.bulkDelete(ids)

        await collection.bulkAdd(adds);
    }

    private identityBulkOperations<TEntity extends {}>(
        event: DbPluginBulkOperationsEvent<TEntity>,
        done: (result: EntityModificationResult<TEntity>, error?: any) => void) {
        this._doWork(event, (db, d) => {
            try {

                const { removes } = event.operation;

                this._persistIdentity(event, db).then(x => {
                    d({
                        adds: x as DeepPartial<InferCreateType<TEntity>>[],
                        removedCount: removes.length, // If there are no errors, we assume this succeeds
                        updates: []
                    })
                }).catch(e => {
                    d(null, e);
                });
            } catch (e) {
                d(null, e);
            }
        }, done);
    }

    private defaultBulkOperations<TEntity extends {}>(
        event: DbPluginBulkOperationsEvent<TEntity>,
        done: (result: EntityModificationResult<TEntity>, error?: any) => void) {
        this._doWork(event, (db, d) => {
            try {

                const { removes, adds } = event.operation;

                this._persistDefault(event, db).then(x => {
                    d({
                        adds: adds as DeepPartial<InferCreateType<TEntity>>[],
                        removedCount: removes.length, // If there are no errors, we assume this succeeds
                        updates: []
                    })
                }).catch(e => {
                    d(null, e);
                });
            } catch (e) {
                d(null, e);
            }
        }, done);
    }

    private getSchemas<TEntity extends {}>(event: DbPluginEvent<TEntity>): Record<string, string> {
        if (cache.has(this.dbName)) {
            return cache.get(this.dbName);
        }

        const { parent } = event;
        const schemas = parent.allSchemas();
        const result: Record<string, string> = {};

        for (const schema of schemas) {
            result[schema.collectionName] = convertToDexieSchema(schema)
        }

        cache.set(this.dbName, result);

        return result;
    }

    query<TEntity extends {}, TShape extends any = TEntity>(event: DbPluginQueryEvent<TEntity, TShape>, done: (result: TShape, error?: any) => void): void {
        this._doWork(event, (db, d) => {
            const { operation, schema } = event;
            const { collectionName } = schema;
            const { options } = operation;
            const translator = new JsonTranslator<TEntity, TShape>(operation);

            // Start with the base collection
            let collection = db.table(collectionName).toCollection();

            // Apply filters if any
            if (operation.filters?.length > 0) {
                for (const filter of operation.filters) {
                    collection = collection.filter(filter.filter);
                }
            }

            // Apply skip
            if (options.skip) {
                collection = collection.offset(options.skip);
            }

            // Apply take
            if (options.take) {
                collection = collection.limit(options.take);
            }

            // Apply distinct
            if (options.distinct) {
                collection = collection.distinct();
            }

            // Get the data first
            collection.toArray().then(data => {
                const result = translator.translate(data);

                d(result);
            }).catch(e => d(null, e));
        }, done);
    }

    [Symbol.dispose](): void {

    }
}