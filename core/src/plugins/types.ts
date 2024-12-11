import { CompiledSchema, EntityChanges, EntityModificationResult, Expression, IdType, NonNullEntity } from "..";

export interface IDbPlugin {
    query<TEntity extends {}>(expression: Expression, resolve: (entities: TEntity[]) => void, reject: (error?: any) => void): void;
    all<TEntity extends {}>(tableName: string, resolve: (entities: TEntity[]) => void, reject: (error?: any) => void): void;
    get<TEntity extends {}>(tableName: string, ids: IdType[], resolve: (entities: TEntity[]) => void, reject: (error?: any) => void): void;
    destroy(resolve: () => void, reject: () => void): void;
    bulkOperations<T extends {}>(schema: CompiledSchema<T>, operations: EntityChanges<T>, resolve: (result: EntityModificationResult<NonNullEntity<T>>) => void, reject: (error?: any) => void): void;
}