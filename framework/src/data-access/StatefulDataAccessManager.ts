import { CompiledSchema, EntityChanges, EntityModificationResult, IdType, Query, SyncronousQueue, SyncronousUnitOfWork } from '@agrejus/db-framework-core';
import { DataAccessManager } from './DataAccessManager';

const queue = new SyncronousQueue();
const state: Map<IdType, any> = new Map<IdType, any>();

export class StatefulDataAccessManager<T extends {}> extends DataAccessManager<T> {

    override bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        const unitOfWork: SyncronousUnitOfWork = (d) => this._bulkOperations(schema, operations, (r, e) => {
            d();
            done(r, e);
        })

        queue.enqueue(unitOfWork.bind(this));
    }

    // we can only run one query at a time and need to wait on the others
    // whether the data source can handle async or not, we need it here
    // because other operations depend on each other.  State needs to be hydrated before we can accept more queries
    // otherwise state could be incorrect
    override fetch(query: Query<T>, done: (result: T[], error?: any) => void) {
        const unitOfWork: SyncronousUnitOfWork = (d) => this._fetch(query, (r, e) => {
            d();
            done(r, e);
        })
        queue.enqueue(unitOfWork.bind(this));
    }

    private _bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {

        this.dbPlugin.bulkOperations(schema, operations, (r, e) => {

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

    private _fetch(query: Query<T>, done: (result: T[], error?: any) => void) {

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

                    const entities = this.applyQueryExpressionAndFiltering([...state.values()], query);
                    const resolved = this.postProcessResult(entities, query);
                    done(resolved);
                    return;
                }

                done([], e);
            });
            return;
        }
        
        console.log('Queried State')
        // need to run this after filtering, otherwise we attach and run too much
        const entities = this.applyQueryExpressionAndFiltering([...state.values()], query);
        const resolved = this.postProcessResult(entities, query);

        done(resolved);
    }
}