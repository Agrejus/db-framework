import { EntityModificationResult, InferType, Query, assertIsNotNull, InferCreateType, DbPluginLogging, IDbPluginReplicator, OptimisticDbPluginReplicator, assertInstanceOfDbPluginLogging, IDbPlugin, DbPluginReplicator } from "@agrejus/db-framework-core";
import { IDataAccessStrategy } from "../types";
import { DataAccessStrategyBase } from "./DataAccessStrategyBase";
import { assertIsMemoryPlugin, MemoryPlugin } from "@agrejus/db-framework-plugin-memory";
import { DbSetOptions, StatefulDbSetOptions } from "../../types";
import { DbPluginBulkOperationsEvent, DbPluginQueryEvent } from "@agrejus/db-framework-core/dist/plugins/types";

let dbPluginReplicator: IDbPluginReplicator;

const getReplicator = (dbPlugin: IDbPlugin, optimistic?: boolean) => {
    if (dbPluginReplicator != null) {
        return dbPluginReplicator;
    }

    if (optimistic === true) {
        dbPluginReplicator = OptimisticDbPluginReplicator.create({
            replicas: [],
            source: dbPlugin,
            read: dbPlugin instanceof DbPluginLogging ? DbPluginLogging.create(new MemoryPlugin()) : new MemoryPlugin()
        });
    } else {
        dbPluginReplicator = DbPluginReplicator.create({
            replicas: [],
            source: dbPlugin,
            read: dbPlugin instanceof DbPluginLogging ? DbPluginLogging.create(new MemoryPlugin()) : new MemoryPlugin()
        });
    }

    return dbPluginReplicator;
}

export class StatefulDataAccessStrategy<T extends {}> extends DataAccessStrategyBase<T> implements IDataAccessStrategy<T> {

    bulkOperations(dbSetOptions: DbSetOptions, event: DbPluginBulkOperationsEvent<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        const optimistic = (dbSetOptions as StatefulDbSetOptions).optimistic;
        getReplicator(this.dbPlugin, optimistic).bulkOperations(event, done);
    }

    query<TShape>(_: DbSetOptions, event: DbPluginQueryEvent<T, TShape>, done: (response: TShape, error?: any) => void) {

        const replicator = getReplicator(this.dbPlugin);

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
            const queryAll = Query.all<T, InferType<T>[]>();

            this.dbPlugin.query<T, InferType<T>[]>({
                operation: queryAll,
                parent: event.parent,
                schema: event.schema
            }, (r, e) => {

                if (e != null) {
                    done(null, e);
                    return;
                }

                // Add data to the read plugin
                readPlugin.bulkOperations({
                    operation: {
                        adds: r as InferCreateType<T>[],
                        removes: [],
                        updates: new Map()
                    },
                    parent: event.parent,
                    schema: event.schema
                }, (_, bulkOperationsError) => {

                    if (bulkOperationsError != null) {
                        done(null, bulkOperationsError);
                        return;
                    }

                    // query the replicator now
                    replicator.query(event, done);
                })
            });
            return;
        }

        return replicator.query(event, done);
    }
}