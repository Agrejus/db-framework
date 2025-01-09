import { CompiledSchema, EntityChanges, EntityModificationResult, Query } from '@agrejus/db-framework-core';

export type ReadOperation<TEntity extends {}> = Query<TEntity> & {
    done: (result: TEntity[], error?: any) => void
}

export type UpsertOperation<TEntity extends {}> = {
    schema: CompiledSchema<TEntity>;
    operations: EntityChanges<TEntity>;
    done: (result: EntityModificationResult<TEntity>, error?: any) => void;
}

export type DbOperation<TEntity extends {}> = UpsertOperation<TEntity> | ReadOperation<TEntity>