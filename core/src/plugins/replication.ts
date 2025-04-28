import { TrampolinePipeline } from '../common/TrampolinePipeline';
import { CompiledSchema, InferCreateType, InferType } from '../schema';
import { EntityChanges, EntityModificationResult, IDbPlugin, IdbPluginCollection, Query } from './types';

type OperationsPayload = {
    plugins: IDbPlugin[];
    index: number;
    errors: any[];
}

type PersistPayload<TEntity extends {}> = OperationsPayload & {
    operations: EntityChanges<TEntity>;
    result?: EntityModificationResult<TEntity>;
    schema: CompiledSchema<TEntity>;
}

export class DbPluginReplicator implements IDbPlugin {

    private _plugins: IdbPluginCollection;

    private constructor(plugins: IdbPluginCollection) {
        this._plugins = plugins;
    }

    /**
     * Creates a new DbPluginReplicator that coordinates operations between a source database and its replicas.
     * 
     * @param source The primary database plugin that will receive all operations first
     * @param replicas Additional database plugins that will replicate operations from the source
     * @returns A new DbPluginReplicator instance that manages the source-replica relationship
     */
    static create(source: IDbPlugin, ...replicas: IDbPlugin[]) {
        return new DbPluginReplicator({
            source,
            replicas
        });
    }

    query<TEntity extends {}>(query: Query<TEntity>, done: (entities: InferType<TEntity>[], error?: any) => void): void {
        try {
            this._plugins.source.query(query, done);
        } catch (e: any) {
            done([], e);
        }
    }

    destroy(done: (error?: any) => void): void {
        try {

            const pipeline = new TrampolinePipeline<OperationsPayload>();
            const plugins = [this._plugins.source, ...this._plugins.replicas];
            const data: OperationsPayload = {
                plugins,
                index: 0,
                errors: []
            };

            for (let i = 0, length = plugins.length; i < length; i++) {
                pipeline.pipe<OperationsPayload>(this._destroy.bind(this))
            }

            pipeline.filter<OperationsPayload>(data, (result) => {

                if (result.errors.length > 0) {
                    done(result.errors);
                    return;
                }

                done();
            });

        } catch (e: any) {
            done(e);
        }
    }

    private _destroy(payload: OperationsPayload, done: (payload: OperationsPayload) => void) {
        const { plugins, index } = payload;
        const plugin = plugins[index];

        // move next
        payload.index++;

        plugin.destroy((e) => {
            if (e != null) {
                payload.errors.push(e);
            }
        });
    }

    private _persist<TEntity extends {}>(payload: PersistPayload<TEntity>, done: (payload: PersistPayload<TEntity>) => void) {
        const { plugins, index, schema, operations, result } = payload;
        const plugin = plugins[index];

        // move next
        payload.index++;

        // source is first
        if (payload.index === 1) {
            plugin.bulkOperations(schema, operations, (r, e) => {
                payload.result = r;

                if (e != null) {
                    payload.errors.push(e);
                }

                done(payload);
            });
            return;
        }

        if (result == null) {
            done(payload);
            return;
        }

        const { adds } = result;

        plugin.bulkOperations(schema, {
            adds: adds as InferCreateType<TEntity>[], // pass in the resulting additions to get any keys that were set
            updates: operations.updates,
            removes: operations.removes
        }, (_, e) => {

            if (e != null) {
                payload.errors.push(e);
            }

            done(payload);
        });
    }

    bulkOperations<TEntity extends {}>(schema: CompiledSchema<TEntity>, operations: EntityChanges<TEntity>, done: (result: EntityModificationResult<TEntity>, error?: any) => void): void {

        try {
            // insert into the source first to generate any ids, then take the result and persist that into the replicas
            const pipeline = new TrampolinePipeline<OperationsPayload>();
            const plugins = [this._plugins.source, ...this._plugins.replicas];
            const data: PersistPayload<TEntity> = {
                plugins,
                index: 0,
                errors: [],
                schema,
                operations
            };

            for (let i = 0, length = plugins.length; i < length; i++) {
                pipeline.pipe<PersistPayload<TEntity>>(this._persist.bind(this))
            }

            pipeline.filter<PersistPayload<TEntity>>(data, (result) => {

                if (result.errors.length > 0) {

                    if (result.result != null) {
                        done(result.result, result.errors);
                        return;
                    }

                    done({
                        adds: [],
                        removedCount: 0,
                        updates: []
                    }, result.errors);
                    return;
                }

                if (result.result == null) {
                    done({
                        adds: [],
                        removedCount: 0,
                        updates: []
                    });
                    return;
                }

                done(result.result);
            });

        } catch (e: any) {
            done(e);
        }
    }
}