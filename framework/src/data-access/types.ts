import { CompiledSchema, EntityChanges, EntityModificationResult, InferType, Query } from "@agrejus/db-framework-core";

export interface IDataAccessManager<T extends {}> {
    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void): void;
    fetch<TShape>(query: Query<TShape, T>, done: (result: T[], error?: any) => void): void;
    subscribe<TShape, U>(query: Query<TShape, T>, shape: (data: T[]) => U, done: (result: U, error?: any) => void): () => void;
    readonly schema: CompiledSchema<T>;
}

export type FetchOptions = { mergeResponse?: boolean }

export interface IDataAccessStrategy<T extends {}> {
    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void): void;
    fetch<TShape>(query: Query<TShape, T>, done: (response: { result: TShape, shouldEnableChangeTracking: boolean }, error?: any) => void): void;
    filter<TShape>(query: Query<TShape, T>, data: InferType<T>[]): InferType<T>[];
}