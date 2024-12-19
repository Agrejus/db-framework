import { CompiledSchema, DeepPartial, Expression, IdType, NonNullCreateEntity, NonNullEntity } from "..";

export interface IDbPlugin {
    query<TEntity extends {}>(schema: CompiledSchema<TEntity>, expression: Expression, done: (entities: NonNullEntity<TEntity>[], error?: any) => void): void;
    all<TEntity extends {}>(schema: CompiledSchema<TEntity>, done: (entities: NonNullEntity<TEntity>[], error?: any) => void): void;
    get<TEntity extends {}>(schema: CompiledSchema<TEntity>, ids: IdType[], done: (entities: NonNullEntity<TEntity>[], error?: any) => void): void;
    destroy(done: (error?: any) => void): void;
    bulkOperations<TEntity extends {}>(schema: CompiledSchema<TEntity>, operations: EntityChanges<TEntity>, done: (result: EntityModificationResult<NonNullEntity<TEntity>>, error?: any) => void): void;
}

export type EntityChanges<T extends {}> = {
    adds: NonNullCreateEntity<T>[];
    removes: NonNullEntity<T>[];
    updates: {
        data: NonNullEntity<T>[];
        deltas: Map<IdType, NonNullEntity<T>>;
    };
}

export type EntityModificationResult<T extends {}> = {
    adds: DeepPartial<NonNullCreateEntity<T>>[];
    removedCount: number;
    updates: NonNullEntity<T>[];
}