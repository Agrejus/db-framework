import { CompiledSchema, DeepPartial, EntityChanges, EntityModificationResult, IDbPlugin, IdType, InferCreateType, InferType, Query, SchemaTypes, SyncronousUnitOfWork, toMap, uuidv4 } from '@agrejus/db-framework-core';
import { queryArray } from './expression/resolver';

let data: Record<string, Map<IdType, Record<string, unknown>>> = {};
const numericalIds: Record<string, number> = {};

export class PouchDbPlugin implements IDbPlugin {

    destroy(done: (error?: any) => void): void {
        data = {};
        done();
    }

    bulkOperations<TEntity extends {}>(
        schema: CompiledSchema<TEntity>,
        operations: EntityChanges<TEntity>,
        done: (result: EntityModificationResult<TEntity>, error?: any) => void) {

        const { adds, removes, updates } = operations;

        try {
            const processedAdditions = this._processAdds(schema, adds);
            const processUpdates = this._processUpdates(schema, updates);
            const processedRemovals = this._processRemovals(schema, removes);

            done({
                adds: processedAdditions,
                removedCount: processedRemovals,
                updates: processUpdates

            });
        } catch (e: any) {
            done({
                adds: [],
                removedCount: 0,
                updates: []
            }, e)
        }
    }

    private _processAdds<TEntity extends {}>(schema: CompiledSchema<TEntity>, adds: InferCreateType<TEntity>[]) {
        const tableName = schema.tableName;
        const result: DeepPartial<InferCreateType<TEntity>>[] = [];

        for (let i = 0, length = adds.length; i < length; i++) {
            const add = adds[i] as Record<string, unknown>;

            if (schema.hasIdentityKeys) {

                for (let j = 0, l = schema.idProperties.length; j < l; j++) {
                    const property = schema.idProperties[j];

                    if (add[property.name] != null) {
                        continue;
                    }

                    if (property.type === SchemaTypes.String) {
                        add[property.name] = uuidv4();
                        continue;
                    }

                    if (property.type === SchemaTypes.Number) {

                        if (numericalIds[tableName] == null) {
                            numericalIds[tableName] = 0;
                        }

                        numericalIds[tableName]++;

                        add[property.name] = numericalIds[tableName];
                        continue;
                    }

                    throw new Error(`Id Property '${property.name}' must be string or number, found '${property.type}'`)
                }

                return;
            }

            const id = schema.getId(add as InferType<TEntity>);
            data[tableName].set(id, add);
            result.push(add as DeepPartial<InferCreateType<TEntity>>);
        }

        return result;
    }

    private _processUpdates<TEntity extends {}>(schema: CompiledSchema<TEntity>, updates: Map<IdType, {
        doc: InferType<TEntity>;
        delta: {
            [key: string]: string | number | Date;
        };
    }>) {
        const result: InferType<TEntity>[] = [];
        const tableName = schema.tableName;

        for (const [, { doc }] of updates) {
            const id = schema.getId(doc);
            data[tableName].set(id, doc);
            result.push(doc);
        }

        return result;
    }

    private _processRemovals<TEntity extends {}>(schema: CompiledSchema<TEntity>, removes: InferType<TEntity>[]) {
        const tableName = schema.tableName;
        for (let i = 0, length = removes.length; i < length; i++) {
            const removal = removes[i];
            const id = schema.getId(removal);
            data[tableName].delete(id);
        }

        return removes.length;
    }

    query<TEntity extends {}>(query: Query<TEntity>, done: (entities: InferType<TEntity>[], error?: any) => void): void {

        try {
            const collection = [...data[query.schema.tableName].values()];
            const result = queryArray<InferType<TEntity>>(collection as InferType<TEntity>[]);
            done(result);
        } catch (e) {
            done([], e);
        }
    }
}