import { TrampolinePipeline } from '../../common/TrampolinePipeline';
import { InferCreateType } from '../../schema';
import { DbPluginBulkOperationsEvent, DbPluginQueryEvent, EntityModificationResult, IdbPluginCollection } from '../types';
import { DbPluginReplicator } from './DbPluginReplicator';
import { OperationsPayload, PersistPayload } from './types';

export class OptimisticDbPluginReplicator extends DbPluginReplicator {

    /**
     * Creates a new DbPluginReplicator that coordinates operations between a source database and its replicas.
     * 
     * @param source The primary database plugin that will receive all operations first
     * @param replicas Additional database plugins that will replicate operations from the source
     * @returns A new DbPluginReplicator instance that manages the source-replica relationship
     */
    static create(plugins: Required<IdbPluginCollection>) {
        return new OptimisticDbPluginReplicator(plugins);
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

    private _optimisticPersist<TEntity extends {}>(payload: PersistPayload<TEntity>, done: (payload: PersistPayload<TEntity>) => void) {
        const { plugins, index, event } = payload;
        const plugin = plugins[index];

        // move next
        payload.index++;

        plugin.bulkOperations({
            operation: {
                adds: event.operation.adds, // pass in the resulting additions to get any keys that were set
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

            const deferredPipeline = new TrampolinePipeline<OperationsPayload>();
            const deferredPlugins = [this.plugins.source, ... this.plugins.replicas];

            if (this.plugins.read == null) {
                throw new Error("Read plugin cannot be null or undefined for optimistic updates");
            }

            for (let i = 0, length = deferredPlugins.length; i < length; i++) {
                deferredPipeline.pipe<PersistPayload<TEntity>>(this._optimisticPersist.bind(this))
            }

            this.plugins.read.bulkOperations({
                operation: {
                    adds: event.operation.adds, // pass in the resulting additions to get any keys that were set
                    updates: event.operation.updates,
                    removes: event.operation.removes
                },
                parent: event.parent,
                schema: event.schema
            }, (r, e) => {

                if (e != null) {
                    done(null, e);
                    return;
                }

                // optimistically call done and still continue saving the rest of the data.  We read from the memory
                // db anyways
                done(r);

                const data: PersistPayload<TEntity> = {
                    plugins: deferredPlugins,
                    index: 0,
                    errors: [],
                    event: {
                        operation: {
                            updates: event.operation.updates,
                            removes: event.operation.removes,
                            adds: r.adds as InferCreateType<TEntity>[] // pass in the new adds with the keys set
                        },
                        parent: event.parent,
                        schema: event.schema
                    }
                };

                setTimeout(() => {
                    deferredPipeline.filter<PersistPayload<TEntity>>(data, (_) => {
                        // no-op for now, maybe implement retries?
                        console.log('I AM DONE!');
                    });
                }, 5);
            });

        } catch (e: any) {
            done(null, e);
        }
    }
}