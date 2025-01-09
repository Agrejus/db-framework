import { CompiledSchema, EntityChanges, EntityModificationResult, IDbPlugin, Query } from '@agrejus/db-framework-core';
import { IChangeTracker } from '../change-tracking/types';

export class DataAccessManager<T extends {}> {

    protected readonly schema: CompiledSchema<T>;
    protected readonly dbPlugin: IDbPlugin;
    protected readonly changeTracker: IChangeTracker<T>;

    constructor(schema: CompiledSchema<T>, dbPlugin: IDbPlugin, changeTracker: IChangeTracker<T>) {
        this.schema = schema;
        this.dbPlugin = dbPlugin;
        this.changeTracker = changeTracker;
    }

    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void) {
        this.dbPlugin.bulkOperations(schema, operations, done);
    }

    fetch(query: Query<T>, done: (result: T[], error?: any) => void) {

        const shouldEnableChangeTracking = query.options.fields?.length == null || query.options.fields.length === 0;

        this.dbPlugin.query<T>(query, (r, e) => {

            if (!e) {
                const entities = r as T[];

                if (shouldEnableChangeTracking === true) {
                    const enriched = entities.map(w => this.schema.enrich(w as any));
                    const resolved = this.changeTracker.resolve(enriched);
                    done(resolved as T[]);
                    return;
                }

                done(entities);
                return;
            }

            done([], e);
        });
    }

    subscribe<U>(query: Query<T>, shape: (data: T[]) => U, done: (result: U, error?: any) => void) {
        return this.changeTracker.subscribe(query, shape, done);
    }
}