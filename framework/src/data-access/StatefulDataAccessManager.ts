import { CompiledSchema, EntityChanges, EntityModificationResult, Query, SyncronousQueue, SyncronousUnitOfWork } from '@agrejus/db-framework-core';
import { DataAccessManager } from './DataAccessManager';


const queue = new SyncronousQueue();
const state: any[] = [];

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

        // we need to update state!!!!!!!!!!!
        this.dbPlugin.bulkOperations(schema, operations, done);
    }

    private _fetch(query: Query<T>, done: (result: T[], error?: any) => void) {

        // if we have no data in memory, then no matter the first query we need to automatically select all, then run memory queries
        if (state.length === 0) {
            // hydrate by selecting everything
            this.dbPlugin.query<T>({
                filters: [],
                options: {},
                schema: this.schema
            }, (r, e) => {

                if (!e) {
                    state.push(...r); // push raw
                    
                    const entities = this.applyQueryExpressionAndFiltering(state, query);
                    const resolved = this.postProcessResult(entities, query);
                    done(resolved);
                    return;
                }

                done([], e);
            });
            return;
        }

        // need to run this after filtering, otherwise we attach and run too much
        const entities = this.applyQueryExpressionAndFiltering(state, query);
        const resolved = this.postProcessResult(entities, query);

        done(resolved);
    }
}