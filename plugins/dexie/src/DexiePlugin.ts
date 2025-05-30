import { IDbPlugin, EntityModificationResult, DbPluginQueryEvent, DbPluginBulkOperationsEvent, DbPluginEvent } from "@agrejus/db-framework-core";
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

        // compare schemas
        const stores = this.getSchemas(event);

        db.version(1).stores(stores);

        work(db, (result, error) => {

            if (shouldClose) {
                db.close();
                return
            }

            done(result, error);
        });
    }

    destroy(done: (error?: any) => void): void {

        done();
    }

    bulkOperations<TEntity extends {}>(
        event: DbPluginBulkOperationsEvent<TEntity>,
        done: (result: EntityModificationResult<TEntity>, error?: any) => void) {

        this.getSchemas(event);

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

        try {

            const r = this.getSchemas(event);
            debugger;
            console.log(r);

            done(null as any);

        } catch (e) {
            done(null as any, e);
        }
    }

    [Symbol.dispose](): void {

    }
}