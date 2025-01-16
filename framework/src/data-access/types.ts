import { CompiledSchema, EntityChanges, EntityModificationResult, Query } from "@agrejus/db-framework-core";

export interface IDataAccessManager<T extends {}> {
    bulkOperations(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void): void;
    fetch(query: Query<T>, done: (result: T[], error?: any) => void): void;
    subscribe<U>(query: Query<T>, shape: (data: T[]) => U, done: (result: U, error?: any) => void): () => void;
    readonly schema: CompiledSchema<T>;
}

export type FetchOptions = { mergeResponse?: boolean }