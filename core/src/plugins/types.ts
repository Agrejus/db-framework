import { CompiledSchema, DeepPartial, Expression, IdType, NonNullCreateEntity, NonNullEntity } from "..";

export interface IDbPlugin {
    query<TEntity extends {}>(query: Query<TEntity>, done: (entities: NonNullEntity<TEntity>[], error?: any) => void): void;
    destroy(done: (error?: any) => void): void;
    bulkOperations<TEntity extends {}>(schema: CompiledSchema<TEntity>, operations: EntityChanges<TEntity>, done: (result: EntityModificationResult<TEntity>, error?: any) => void): void;
}

export type EntityChanges<T extends {}> = {
    adds: NonNullCreateEntity<T>[];
    removes: NonNullEntity<T>[];
    updates: Map<IdType, { doc: NonNullEntity<T>, delta: { [key:string]: string | number | Date } }>;
}

export type EntityModificationResult<T extends {}> = {
    adds: DeepPartial<NonNullCreateEntity<T>>[];
    removedCount: number;
    updates: NonNullEntity<T>[];
}

export type QueryOptions = {
    skip?: number;
    take?: number;
    sort?: QuerySort[],
    min?: boolean;
    max?: boolean;
    count?: boolean;
    sum?: boolean;
    distinct?: boolean;
    fields?: QueryField[];
}

export type QuerySort = { key: string, direction: "asc" | "desc" };
export type Query<TEntity extends {}> = { schema: CompiledSchema<TEntity>, expression?: Expression, options: QueryOptions }
export type QueryField = { sourceName: string, destinationName: string };