import { CompiledSchema, EntityChanges, EntityModificationResult, Filter, Filterable, IDbPlugin, IdType, ParamsFilter, Query, SyncronousQueue, SyncronousUnitOfWork } from "@agrejus/db-framework-core";
import { IDataAccessStrategy } from "../types";
import { DataAccessStrategyBase } from "./DataAccessStrategyBase";

const queue = new SyncronousQueue();
const state: Map<IdType, any> = new Map<IdType, any>();

export class StatefulDataAccessStrategy<T extends {}> extends DataAccessStrategyBase<T> implements IDataAccessStrategy<T> {

    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        const unitOfWork: SyncronousUnitOfWork = (d) => this._statefulBulkOperations(schema, operations, (r, e) => {
            d();
            done(r, e);
        })

        queue.enqueue(unitOfWork.bind(this));
    }

    fetch(query: Query<T>, done: (response: { result: T[], shouldEnableChangeTracking: boolean }, error?: any) => void) {
        // if we have no data in memory, then no matter the first query we need to automatically select all, then run memory queries
        if (state.size === 0) {
            // hydrate by selecting everything
            this.dbPlugin.query<T>({
                filters: [],
                options: {},
                schema: this.schema
            }, (r, e) => {

                if (!e) {
                    // need to get the id for each and add to the map
                    for (const item of r) {
                        const id = this.schema.getId(item);
                        state.set(id, item); // push raw
                    }

                    const result = this._applyQueryExpressionAndFiltering([...state.values()], query);
                    const shouldEnableChangeTracking = super._shouldEnableChangeTracking(query);

                    done({ result, shouldEnableChangeTracking });
                    return;
                }

                done({ result: [], shouldEnableChangeTracking: false }, e);
            });
            return;
        }

        console.log('Queried State')
        // need to run this after filtering, otherwise we attach and run too much
        const result = this._applyQueryExpressionAndFiltering([...state.values()], query);
        const shouldEnableChangeTracking = super._shouldEnableChangeTracking(query);

        done({ result, shouldEnableChangeTracking });
    }

    private _statefulBulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {

        super._bulkOperations(schema, operations, (r, e) => {

            const { adds, updates, removedCount } = r;
            // need to merge adds with data sent in
            adds.forEach(add => {
                const id = this.schema.getId(add as any);
                const found = state.get(id);

                if (found == null) {
                    state.set(id, found);
                    return;
                }

                // Let's only map Ids and identities
                this.schema.merge(found as any, add as any); // merge needs to map children appropriately
            });

            // need to merge updates in case we have identity properties
            updates.forEach(update => {
                const id = this.schema.getId(update as any);
                const found = state.get(id);

                if (found == null) {
                    state.set(id, found);
                    return;
                }

                // Let's only map Ids and identities
                this.schema.merge(found as any, update as any); // merge needs to map children appropriately
            });

            operations.removes.forEach(removal => {
                const id = this.schema.getId(removal as any);

                if (state.has(id)) {
                    state.delete(id);
                    return;
                }
            });

            done(r, e);
        });
    }
}