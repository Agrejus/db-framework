import { CompiledSchema, DeepPartial, Expression, IdType, InferCreateType, InferType } from "..";
import { Filterable } from "../expressions/types";

export interface IDbPlugin {
    query<TEntity extends {}, TShape extends any = TEntity>(query: IQuery<TEntity, TShape>, done: (result: TShape, error?: any) => void): void;
    destroy(done: (error?: any) => void): void;
    bulkOperations<TEntity extends {}>(schema: CompiledSchema<TEntity>, operations: EntityChanges<TEntity>, done: (result: EntityModificationResult<TEntity>, error?: any) => void): void;
}

export type IdbPluginCollection = {
    source: IDbPlugin;
    replicas: IDbPlugin[];
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
}

export type QuerySort = { key: string, direction: "asc" | "desc" };

export type IQuery<TEntity extends {}, TShape extends any = TEntity> = {
    schema: CompiledSchema<TEntity>;
    expression?: Expression;
    options: QueryOptions;
    filters: Filterable<TShape, any>[];
    filter: (data: TShape) => TShape;
    // we can only enable change tracking when we do not change (reduce/aggregate) the response
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