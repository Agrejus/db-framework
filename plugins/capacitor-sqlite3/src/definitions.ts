import type { IBulkOperationsResponse, IQueryParams, IDbRecord } from '@agrejus/db-framework'

export type CapacitorSqliteRecord<TDocumentType extends string> = {
  readonly _id: string;
  readonly _rev: string;
} & IDbRecord<TDocumentType>

export type RegisterSchemas = <TDocumentType extends string, TDocument extends CapacitorSqliteRecord<TDocumentType>>(schemas: { [key in TDocumentType]: new () => TDocument }) => Promise<void>

export interface ICapacitorSqlitePlugin {
  bulkDocs<TDocumentType extends string, TDocument extends CapacitorSqliteRecord<TDocumentType>>(operations: { adds: TDocument[]; removes: TDocument[]; updates: TDocument[]; }): Promise<IBulkOperationsResponse>;
  get<TDocumentType extends string, TDocument extends CapacitorSqliteRecord<TDocumentType>>(...ids: string[]): Promise<TDocument[]>;
  destroy(): Promise<void>;
  all<TDocumentType extends string, TDocument extends CapacitorSqliteRecord<TDocumentType>>(payload?: IQueryParams<TDocumentType>): Promise<TDocument[]>;
}

export interface ISqliteInstance {
  write(transaction: () => void): void;
  deleteAll(): void;
  close(): void;
  objects<T>(schema: new () => T): T[];
  create<T>(schema: new () => any, doc: T, changeType?: "modified"): T;
  delete<T>(doc: T): void;
}

export interface ISqliteDatabase {
  new(path: string): ISqliteDatabase;
  serialize(callback: () => void): void;
  parallelize(callback: () => void): void;
  run(sql: string, callback?: (error: Error | null, rows: any[]) => void): void;
  run(sql: string, params?: any, callback?: (error: Error | null, rows: any[]) => void): void;
  all(sql: string, callback: (error: Error | null, rows: any[]) => void): void;
  all(sql: string, params: any, callback: (error: Error | null, rows: any[]) => void): void;
  close(): void;
}

export interface ISqliteOptions {
  fileName: string;
  tableName: string;
}

export interface ISqliteContext {
  verbose(): ISqliteDatabase
  Database: ISqliteDatabase;
}