import { CompiledSchema, DbOperation, EntityChanges, EntityModificationResult, Query, ReadOperation, UpsertOperation } from '@agrejus/db-framework-core';
import { DataAccessManager } from './DataAccessManager';

const state: any[] = [];
const queue: DbOperation<any>[] = [];
let current: DbOperation<any> | null = null;

export class StatefulDataAccessManager<T extends {}> extends DataAccessManager<T> {

    override bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        const upsertOperation: UpsertOperation<T> = {
            done,
            operations,
            schema
        };

        queue.push(upsertOperation);
        this._next();
    }

    // we can only run one query at a time and need to wait on the others
    // whether the data source can handle async or not, we need it here
    // because other operations depend on each other.  State needs to be hydrated before we can accept more queries
    // otherwise state could be incorrect
    override fetch(query: Query<T>, done: (result: T[], error?: any) => void) {
        const readOperation: ReadOperation<any> = {
            done,
            ...query
        };
        queue.push(readOperation);
        this._next();
    }

    private _bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
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

                //console.log("fetch", performance.now() - s);
                if (!e) {
                    state.push(...r)
                    const entities = this.applyQueryExpressionAndFiltering(state, query);
                    const resolved = this.postProcessResult(entities, query);
                    done(resolved);
                    return;
                }

                done([], e);
            });
            return;
        }

        console.log('select from state')
        const entities = this.applyQueryExpressionAndFiltering(state, query);
        const resolved = this.postProcessResult(entities, query);

        done(resolved);
    }

    private _next() {

        if (current != null || queue.length === 0) {
            return;
        }

        current = queue.shift();

        if ("operations" in current) {
            const upsertOperation = current;
            this._bulkOperations(upsertOperation.schema, upsertOperation.operations, (r, e) => {
                current = null;
                upsertOperation.done(r, e);
                this._next();
            });
            return;
        }

        const queryOperation = current;
        this._fetch(queryOperation, (r, e) => {
            current = null;
            queryOperation.done(r as any, e);
            this._next();
        });
    }
}