import { IDbPlugin, CompiledSchema, EntityChanges, EntityModificationResult, InferCreateType, DeepPartial, IdType, InferType, IQuery, JsonTranslator, DbPluginBulkOperationsEvent, DbPluginQueryEvent } from "@agrejus/db-framework-core";
import { DbCollection } from "./DbCollection";
import { MemoryDatabase } from ".";

const dbs: Record<string, MemoryDatabase> = {}

export class MemoryPlugin implements IDbPlugin, Disposable {

    private readonly dbName: string;

    constructor(dbName?: string) {
        this.dbName = dbName ?? "__dbframework-memory-plugin-db__";

        if (dbs[this.dbName] == null) {
            dbs[this.dbName] = {}
        }
    }

    get size() {
        let count = 0;

        for (const collectionName in this.database) {
            count += this.database[collectionName].size;
        }

        return count;
    }

    private get database() {
        return dbs[this.dbName];
    }

    private resolveCollection<TEntity extends {}>(schema: CompiledSchema<TEntity>) {

        if (dbs[this.dbName][schema.collectionName] == null) {
            dbs[this.dbName][schema.collectionName] = new DbCollection(schema);
        }

        return dbs[this.dbName][schema.collectionName];
    }

    seed<TEntity extends {}>(schema: CompiledSchema<TEntity>, data: Record<string, unknown>[]) {
        const collection = this.resolveCollection(schema);
        collection.seed(data);
    }

    destroy(done: (error?: any) => void): void {
        dbs[this.dbName] = {};
        done();
    }

    bulkOperations<TEntity extends {}>(
        event: DbPluginBulkOperationsEvent<TEntity>,
        done: (result: EntityModificationResult<TEntity>, error?: any) => void) {

        const { operation, schema } = event;
        const { adds, removes, updates } = operation;

        try {
            const processedAdditions = this._processAdds(schema, adds);
            const processUpdates = this._processUpdates(schema, updates);
            const processedRemovals = this._processRemovals(schema, removes);

            done({
                adds: processedAdditions,
                removedCount: processedRemovals,
                updates: processUpdates

            });
        } catch (e: any) {
            done({
                adds: [],
                removedCount: 0,
                updates: []
            }, e)
        }
    }

    private _processAdds<TEntity extends {}>(schema: CompiledSchema<TEntity>, adds: InferCreateType<TEntity>[]) {
        const result: DeepPartial<InferCreateType<TEntity>>[] = [];
        const collection = this.resolveCollection(schema);

        for (let i = 0, length = adds.length; i < length; i++) {
            collection.add(adds[i]);
            result.push(adds[i] as DeepPartial<InferCreateType<TEntity>>);
        }

        return result;
    }

    private _processUpdates<TEntity extends {}>(schema: CompiledSchema<TEntity>, updates: Map<IdType, {
        doc: InferType<TEntity>;
        delta: {
            [key: string]: string | number | Date;
        };
    }>) {
        const result: InferType<TEntity>[] = [];
        const collection = this.resolveCollection(schema);

        for (const [, { doc }] of updates) {
            collection.update(doc);
            result.push(doc);
        }

        return result;
    }

    private _processRemovals<TEntity extends {}>(schema: CompiledSchema<TEntity>, removes: InferType<TEntity>[]) {
        const collection = this.resolveCollection(schema);

        for (let i = 0, length = removes.length; i < length; i++) {
            collection.remove(removes[i]);
        }

        return removes.length;
    }

    query<TEntity extends {}, TShape extends any = TEntity>(event: DbPluginQueryEvent<TEntity, TShape>, done: (result: TShape, error?: any) => void): void {

        try {
            const { operation, schema } = event;
            const translator = new JsonTranslator<TEntity, TShape>(operation);
            const collection = this.resolveCollection(schema);
            // translate if we are doing any operations like count/sum/min/max/skip/take
            const translated = translator.translate(collection.records);

            done(translated);

        } catch (e) {
            done(null, e);
        }
    }

    [Symbol.dispose](): void {
        dbs[this.dbName] = {};
    }
}