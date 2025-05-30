import { CompiledSchema, DeepPartial, Expression, IdType, InferCreateType, InferType } from "..";
import { Filterable } from "../expressions/types";
import { SchemaParent } from "../schema";

export interface IDbPlugin {
    query<TEntity extends {}, TShape extends any = TEntity>(event: DbPluginQueryEvent<TEntity, TShape>, done: (result: TShape, error?: any) => void): void;
    destroy(done: (error?: any) => void): void;
    bulkOperations<TEntity extends {}>(event: DbPluginBulkOperationsEvent<TEntity>, done: (result: EntityModificationResult<TEntity>, error?: any) => void): void;
}

export type DbPluginQueryEvent<TEntity extends {}, TShape extends any = TEntity> = DbPluginOperationEvent<TEntity, IQuery<TEntity, TShape>>;
export type DbPluginBulkOperationsEvent<TEntity extends {}> = DbPluginOperationEvent<TEntity, EntityChanges<TEntity>>;

export type DbPluginEvent<TEntity extends {}> = {
    schema: CompiledSchema<TEntity>;
    parent: SchemaParent;
}

export type DbPluginOperationEvent<TEntity extends {}, TOperation> = DbPluginEvent<TEntity> & {
    operation: TOperation;
}

/**
 * Represents a collection of database plugins with a primary source and optional replicas
 * Used for implementing read/write separation and high availability
 */
export type IdbPluginCollection = {
    /** The primary database plugin that handles all write operations, do not include in the list of replicas */
    source: IDbPlugin;
    /** Array of replica database plugins that can be used for read operations */
    replicas: IDbPlugin[];
    /** The primary database plugin that handles all read operations, do not include in the list of replicas.  
     * Used when the source plugin should generate the identity properties, but the read replica will only
     * read data.  Typically this is a MemoryPlugin.  Should not be included in the list of replicas
     */
    read?: IDbPlugin;
}

export type EntityChanges<T extends {}> = {
    adds: InferCreateType<T>[];
    removes: InferType<T>[];
    updates: Map<IdType, { doc: InferType<T>, delta: { [key: string]: string | number | Date } }>;
}

export type EntityModificationResult<T extends {}> = {
    adds: DeepPartial<InferCreateType<T>>[];
    removedCount: number;
    updates: InferType<T>[];
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
    shaper?: (item: unknown) => unknown;
}

export type QuerySort = { key: string, selector: (item: unknown) => unknown, direction: "asc" | "desc" };

export type IQuery<TEntity extends {}, TShape extends any = TEntity> = {
    expression?: Expression;
    options: QueryOptions;
    filters: Filterable<TShape, any>[];
    // we can only enable change tracking when we do not change (reduce/aggregate/map) the response
    // from the database
    get changeTracking(): boolean;
};
export type QueryField = {
    sourceName: string,
    destinationName: string,
    getter: <T>(data: Record<string, unknown>) => T;
};

export type ReadOperation<TEntity extends {}> = IQuery<TEntity> & {
    done: (result: TEntity[], error?: any) => void
}

export type UpsertOperation<TEntity extends {}> = {
    schema: CompiledSchema<TEntity>;
    operations: EntityChanges<TEntity>;
    done: (result: EntityModificationResult<TEntity>, error?: any) => void;
}

export type DbOperation<TEntity extends {}> = UpsertOperation<TEntity> | ReadOperation<TEntity>