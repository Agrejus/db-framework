import { EntityModificationResult } from "@agrejus/db-framework-core";
import { DbSetOptions } from "../types";
import { DbPluginBulkOperationsEvent, DbPluginQueryEvent } from "@agrejus/db-framework-core/dist/plugins/types";

export type FetchOptions = { mergeResponse?: boolean }

export interface IDataAccessStrategy<T extends {}> {
    bulkOperations(dbSetOptions: DbSetOptions, event: DbPluginBulkOperationsEvent<T>, done: (result: EntityModificationResult<T>, error?: any) => void): void;
    query<TShape>(dbSetOptions: DbSetOptions, event: DbPluginQueryEvent<T, TShape>, done: (response: TShape, error?: any) => void): void;
}