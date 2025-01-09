import { CompiledSchema, EntityChanges, EntityModificationResult, Filter, Filterable, IDbPlugin, ParamsFilter, Query } from '@agrejus/db-framework-core';
import { IChangeTracker } from '../change-tracking/types';
import { IDataAccessManager } from './types';
import { performance } from 'perf_hooks'

export class DataAccessManager<T extends {}> implements IDataAccessManager<T> {

    readonly schema: CompiledSchema<T>;
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
        //const s = performance.now()
        this.dbPlugin.query<T>(query, (r, e) => {
            //console.log("fetch", performance.now() - s);
            if (!e) {
                const entities = this.applyQueryExpressionAndFiltering(r as T[], query);
                const resolved = this.postProcessResult(entities, query);
                done(resolved);
                return;
            }

            done([], e);
        });
    }

    subscribe<U>(query: Query<T>, shape: (data: T[]) => U, done: (result: U, error?: any) => void) {
        return this.changeTracker.subscribe(query, shape, done);
    }

    protected applyFiltering(data: T[], filters: Filterable<T, any>[]) {
        let result = data;

        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];

            if (filter.params == null) {
                // standard filtering
                const selector = filter.filter as Filter<T>
                result = data.filter(selector);
                continue;
            }

            // params filtering
            const selector = filter.filter as ParamsFilter<T, any>
            result = data.filter(w => selector([w, filter.params]));
        }

        return result;
    }

    protected applyQueryExpressionAndFiltering(data: T[], query: Query<T>) {

        // Memory Filtering Fallback
        if (query.expression == null && query.filters.length > 0) {
            return this.applyFiltering(data, query.filters);
        }

        return data;
    }

    protected postProcessResult(entities: T[], query: Query<T>) {

        const shouldEnableChangeTracking = query.options.fields?.length == null || query.options.fields.length === 0;

        if (shouldEnableChangeTracking === true) {
            const enriched = entities.map(w => this.schema.enrich(w as any));
            const resolved = this.changeTracker.resolve(enriched);
            return resolved as T[]
        }

        return entities;
    }

}