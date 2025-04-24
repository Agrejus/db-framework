import { EntityModificationResult, IdType, InferCreateType, InferType, Query } from "@agrejus/db-framework-core";
import { EntityCallbackMany } from '../types'
import { FetchOptions } from "../data-access/types";

export type QuerySubscription<TEntity extends {}, U> = {
    id: string,
    query: Query<TEntity>;
    shape: (data: TEntity[]) => U;
    done: (result: U, error?: any) => void;
};

export interface IChangeTrackerStrategy<T extends {}> {
    enrich(entities: InferType<T>[]): InferType<T>[];
    add(entities: InferCreateType<T>[], done: EntityCallbackMany<T>): void;
    remove(entities: InferType<T>[], done: EntityCallbackMany<T>): void;
    resolve(entities: InferType<T>[], options?: FetchOptions): InferType<T>[];
    hasChanges(): boolean;
    replace(existingEntity: InferType<T> | InferCreateType<T>, newEntity: InferType<T> | InferCreateType<T>): void;
    prepareRemovals(): InferType<T>[];
    prepareAdditions(): AdditionsPackage<T>;
    getAttachmentsChanges(): UpdatesPackage<T>;
    mergeChanges(changes: EntityModificationResult<T>, addPackge: AdditionsPackage<T>): void;
    clearAdditions(): void;
}

export type UpdatesPackage<T extends {}> = Map<IdType, {
    doc: InferType<T>;
    delta: {
        [key: string]: string | number | Date;
    };
}>;

export type AdditionsPackage<T extends {}> = {
    adds: InferCreateType<T>[],
    find: (entity: InferType<T>) => InferCreateType<T> | undefined
};