import { CompiledSchema, EntityChanges, EntityModificationResult, IdType, InferType, Query, SyncronousQueue, SyncronousUnitOfWork, JsonTranslator, DbPluginReplicator, assertIsNotNull, InferCreateType, DbPluginLogging, IDbPlugin } from "@agrejus/db-framework-core";
import { IDataAccessStrategy } from "../types";
import { DataAccessStrategyBase } from "./DataAccessStrategyBase";
import { assertIsMemoryPlugin, MemoryPlugin } from "@agrejus/db-framework-plugin-memory";
import { assertInstanceOfDbPluginLogging } from "@agrejus/db-framework-core/dist/utilities";

let replicator: DbPluginReplicator;

export class StatefulDataAccessStrategy<T extends {}> extends DataAccessStrategyBase<T> implements IDataAccessStrategy<T> {

    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        super._bulkOperations(schema, operations, done);
    }

    fetch<TShape>(query: Query<T, TShape>, done: (response: TShape, error?: any) => void) {

        if (replicator == null) {
            replicator = DbPluginReplicator.create({
                replicas: [],
                source: this.dbPlugin,
                read: this.dbPlugin instanceof DbPluginLogging ? DbPluginLogging.create(new MemoryPlugin()) : new MemoryPlugin()
            })
        }

        assertIsNotNull(replicator.plugins.read, "Read plugin cannot be null for stateful dbsets");

        let readPlugin: MemoryPlugin;
        if (replicator.plugins.read instanceof DbPluginLogging) {

            assertInstanceOfDbPluginLogging(replicator.plugins.read);

            assertIsMemoryPlugin(replicator.plugins.read.plugin);

            readPlugin = replicator.plugins.read.plugin;
        } else if (replicator.plugins.read instanceof MemoryPlugin) {
            readPlugin = replicator.plugins.read;
        } else {
            throw new Error("Invalid plugin for read plugin for StatefulDbSet")
        }

        if (readPlugin.size === 0) {
            const queryAll = Query.all<T, InferType<T>[]>(this.schema);

            this.dbPlugin.query<T, InferType<T>[]>(queryAll, (r, e) => {

                if (e != null) {
                    done(null, e);
                    return;
                }

                // Add data from main plugin
                replicator.bulkOperations(this.schema, {
                    adds: r as InferCreateType<T>[],
                    removes: [],
                    updates: new Map()
                }, (_, bulkOperationsError) => {

                    if (bulkOperationsError != null) {
                        done(null, bulkOperationsError);
                        return;
                    }

                    // query the replicator now
                    replicator.query(query, done);
                })
            });
            return;
        }

        return replicator.query(query, done);
    }
}