import { TrampolinePipeline } from '../../common/TrampolinePipeline';
import { InferCreateType } from '../../schema';
import { DbPluginBulkOperationsEvent, DbPluginQueryEvent, EntityModificationResult, IDbPlugin, IdbPluginCollection } from '../types';
import { OperationsPayload, PersistPayload } from './types';

export class DbPluginReplicator implements IDbPlugin {

    plugins: IdbPluginCollection;

    protected constructor(plugins: IdbPluginCollection) {
        this.plugins = plugins;
    }

    /**
     * Creates a new DbPluginReplicator that coordinates operations between a source database and its replicas.
     * 
     * @param source The primary database plugin that will receive all operations first
     * @param replicas Additional database plugins that will replicate operations from the source
     * @returns A new DbPluginReplicator instance that manages the source-replica relationship
     */
    static create(plugins: IdbPluginCollection) {
        return new DbPluginReplicator(plugins);
    }

    /**
     * Will query the read plugin if there is one, otherwise the source plugin will be queried
    */
    query<TEntity extends {}, TShape extends any = TEntity>(event: DbPluginQueryEvent<TEntity, TShape>, done: (result: TShape, error?: any) => void): void {
        try {

            const plugin = this.plugins.read != null ? this.plugins.read : this.plugins.source;

            plugin.query(event, done);
        } catch (e: any) {
            done(null, e);
        }
    }

    destroy(done: (error?: any) => void): void {
        try {

            const pipeline = new TrampolinePipeline<OperationsPayload>();
            const plugins = [this.plugins.source, ...this.plugins.replicas];
            const data: OperationsPayload = {
                plugins,
                index: 0,
                errors: []
            };

            for (let i = 0, length = plugins.length; i < length; i++) {
                pipeline.pipe<OperationsPayload>(this.destroyDbs.bind(this))
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

    protected destroyDbs(payload: OperationsPayload, done: (payload: OperationsPayload) => void) {
        const { plugins, index } = payload;
        const plugin = plugins[index];

        // move next
        payload.index++;

        plugin.destroy((e) => {
            if (e != null) {
                payload.errors.push(e);
                return;
            }

            done(payload);
        });
    }

    private _persist<TEntity extends {}>(payload: PersistPayload<TEntity>, done: (payload: PersistPayload<TEntity>) => void) {
        const { plugins, index, event, result } = payload;
        const plugin = plugins[index];

        // move next
        payload.index++;

        // source is first
        if (payload.index === 1) {
            plugin.bulkOperations(event, (r, e) => {
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

        plugin.bulkOperations({
            operation: {
                adds: adds as InferCreateType<TEntity>[], // pass in the resulting additions to get any keys that were set
                updates: event.operation.updates,
                removes: event.operation.removes
            },
            parent: event.parent,
            schema: event.schema
        }, (_, e) => {

            if (e != null) {
                payload.errors.push(e);
            }

            done(payload);
        });
    }

    bulkOperations<TEntity extends {}>(event: DbPluginBulkOperationsEvent<TEntity>, done: (result: EntityModificationResult<TEntity>, error?: any) => void): void {
        try {
            // insert into the source first to generate any ids, then take the result and persist that into the replicas
            const pipeline = new TrampolinePipeline<OperationsPayload>();
            const plugins = [this.plugins.source, ...this.plugins.replicas];

            if (this.plugins.read != null) {
                plugins.push(this.plugins.read);
            }

            const data: PersistPayload<TEntity> = {
                plugins,
                index: 0,
                errors: [],
                event
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
            done(null, e);
        }
    }
}