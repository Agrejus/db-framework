import { CompiledSchema, DeepPartial, Expression, IdType, NonNullCreateEntity, NonNullEntity } from "..";

export interface IDbPlugin {
    query<TEntity extends {}>(expression: Expression, done: (entities: TEntity[], error?: any) => void): void;
    all<TEntity extends {}>(tableName: string, done: (entities: TEntity[], error?: any) => void): void;
    get<TEntity extends {}>(tableName: string, ids: IdType[], done: (entities: TEntity[], error?: any) => void): void;
    destroy(done: (error?: any) => void): void;
    bulkOperations<T extends {}>(schema: CompiledSchema<T>, operations: EntityChanges<T>, done: (result: EntityModificationResult<NonNullEntity<T>>, error?: any) => void): void;
}

export interface IAdditonsPayload<TEntity extends {}> {
    items:  NonNullCreateEntity<TEntity>[];
    get(...ids: IdType[]): NonNullCreateEntity<TEntity> | undefined;
}

export type EntityChanges<T extends {}> = {
    adds: NonNullCreateEntity<T>[];
    removes: {
        entities: NonNullEntity<T>[];
        ids: [IdType][]
    };
    updates: {
        data: NonNullEntity<T>[];
        deltas: Map<IdType, NonNullEntity<T>>;
    };
}

export type EntityModificationResult<T extends {}> = {
    adds: DeepPartial<NonNullCreateEntity<T>>[];
    removedCount: number;
    updates: NonNullEntity<T>[];
}