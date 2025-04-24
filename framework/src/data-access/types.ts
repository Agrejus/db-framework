import { CompiledSchema, EntityChanges, EntityModificationResult, InferType, Query } from "@agrejus/db-framework-core";

export interface IDataAccessManager<T extends {}> {
    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void): void;
    fetch(query: Query<T>, done: (result: T[], error?: any) => void): void;
    subscribe<U>(query: Query<T>, shape: (data: T[]) => U, done: (result: U, error?: any) => void): () => void;
    readonly schema: CompiledSchema<T>;
}

export type FetchOptions = { mergeResponse?: boolean }

export interface IDataAccessStrategy<T extends {}> {
    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void): void;
    fetch(query: Query<T>, done: (response: { result: T[], shouldEnableChangeTracking: boolean }, error?: any) => void): void;
    filter(query: Query<T>, data: InferType<T>[]): InferType<T>[];
}