import { EntityModificationResult, IdType, NonNullCreateEntity, NonNullEntity, Query } from "@agrejus/db-framework-core";
import { EntityCallbackMany } from '../types'
import { FetchOptions } from "../data-access/types";
import { ChangeTrackingType } from "@agrejus/db-framework-core/dist/schema";

export interface IChangeTracker<TEntity extends {}> {
    add(entities: NonNullCreateEntity<TEntity>[], done: EntityCallbackMany<TEntity>): void;
    remove(entities: NonNullEntity<TEntity>[], done: EntityCallbackMany<TEntity>): void;
    resolve(entities: NonNullEntity<TEntity>[], options?: FetchOptions): NonNullEntity<TEntity>[];
    hasChanges(): boolean;
    replace(existingEntity: NonNullEntity<TEntity> | NonNullCreateEntity<TEntity>, newEntity: NonNullEntity<TEntity> | NonNullCreateEntity<TEntity>): void;
    subscribe<U>(query: Query<TEntity>, shape: (data: TEntity[]) => U, done: (result: U, error?: any) => void): () => void;
    readonly changeTrackingType: ChangeTrackingType;
}

export type QuerySubscription<TEntity extends {}, U> = {
    id: string,
    query: Query<TEntity>;
    shape: (data: TEntity[]) => U;
    done: (result: U, error?: any) => void;
};


export interface INewChangeTracker<TEntity extends {}> {
    add(entities: NonNullCreateEntity<TEntity>[], done: EntityCallbackMany<TEntity>): void;
    remove(entities: NonNullEntity<TEntity>[], done: EntityCallbackMany<TEntity>): void;
    resolve(entities: NonNullEntity<TEntity>[], options?: FetchOptions): NonNullEntity<TEntity>[];
    hasChanges(): boolean;
    replace(existingEntity: NonNullEntity<TEntity> | NonNullCreateEntity<TEntity>, newEntity: NonNullEntity<TEntity> | NonNullCreateEntity<TEntity>): void;
}

export interface IChangeTrackerStrategy<T extends {}> {
    enrich(entities: NonNullEntity<T>[]): NonNullEntity<T>[];
    add(entities: NonNullCreateEntity<T>[], done: EntityCallbackMany<T>): void;
    remove(entities: NonNullEntity<T>[], done: EntityCallbackMany<T>): void;
    resolve(entities: NonNullEntity<T>[], options?: FetchOptions): NonNullEntity<T>[];
    hasChanges(): boolean;
    replace(existingEntity: NonNullEntity<T> | NonNullCreateEntity<T>, newEntity: NonNullEntity<T> | NonNullCreateEntity<T>): void;
    prepareRemovals(): NonNullEntity<T>[];
    prepareAdditions(): AdditionsPackage<T>;
    getAttachmentsChanges(): UpdatesPackage<T>;
    mergeChanges(changes: EntityModificationResult<T>, addPackge: AdditionsPackage<T>): void;
    clearAdditions(): void;
}

export type UpdatesPackage<T extends {}> = Map<IdType, {
    doc: NonNullEntity<T>;
    delta: {
        [key: string]: string | number | Date;
    };
}>;

export type AdditionsPackage<T extends {}> = {
    adds: NonNullCreateEntity<T>[],
    find: (entity: NonNullEntity<T>) => NonNullCreateEntity<T> | undefined
};