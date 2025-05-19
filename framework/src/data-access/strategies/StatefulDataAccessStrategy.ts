import { CompiledSchema, EntityChanges, EntityModificationResult, InferType, Query, assertIsNotNull, InferCreateType, DbPluginLogging, IDbPluginReplicator, OptimisticDbPluginReplicator, assertInstanceOfDbPluginLogging, IDbPlugin, DbPluginReplicator } from "@agrejus/db-framework-core";
import { IDataAccessStrategy } from "../types";
import { DataAccessStrategyBase } from "./DataAccessStrategyBase";
import { assertIsMemoryPlugin, MemoryPlugin } from "@agrejus/db-framework-plugin-memory";
import { DbSetOptions, StatefulDbSetOptions } from "../../types";

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

    bulkOperations(dbSetOptions: DbSetOptions, schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        const optimistic = (dbSetOptions as StatefulDbSetOptions).optimistic;
        getReplicator(this.dbPlugin, optimistic).bulkOperations(schema, operations, done);
    }

    fetch<TShape>(_: DbSetOptions, query: Query<T, TShape>, done: (response: TShape, error?: any) => void) {

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
            const queryAll = Query.all<T, InferType<T>[]>(this.schema);

            this.dbPlugin.query<T, InferType<T>[]>(queryAll, (r, e) => {

                if (e != null) {
                    done(null, e);
                    return;
                }

                // Add data to the read plugin
                readPlugin.bulkOperations(this.schema, {
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