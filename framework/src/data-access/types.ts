import { CompiledSchema, EntityChanges, EntityModificationResult, InferType, Query } from "@agrejus/db-framework-core";
import { DbSetOptions } from "../types";

export type FetchOptions = { mergeResponse?: boolean }

export interface IDataAccessStrategy<T extends {}> {
    bulkOperations(dbSetOptions: DbSetOptions, schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<T>, error?: any) => void): void;
    fetch<TShape>(dbSetOptions: DbSetOptions, query: Query<T, TShape>, done: (response: TShape, error?: any) => void): void;
}