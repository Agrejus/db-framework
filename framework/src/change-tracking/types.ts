import { NonNullCreateEntity, NonNullEntity, Query } from "@agrejus/db-framework-core";
import { EntityCallbackMany } from '../types'
import { FetchOptions } from "../data-access/types";
import { ChangeTrackingType } from "@agrejus/db-framework-core/dist/schema";

export interface IChangeTracker<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> {
    add(entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[], done: EntityCallbackMany<TEntity>): void;
    remove(entities: NonNullEntity<TEntity>[], done: EntityCallbackMany<TEntity>): void;
    //saveChanges(done: (result: number, error?: any) => void): void;
    resolve(entities: NonNullEntity<TEntity>[], options?: FetchOptions): NonNullEntity<TEntity>[];
    hasChanges(): boolean;
    replace(existingEntity: NonNullEntity<TEntity> | NonNullCreateEntity<TEntity>, newEntity: NonNullEntity<TEntity> | NonNullCreateEntity<TEntity>): void;
    subscribe<U>(query: Query<TEntity>, shape: (data: TEntity[]) => U, done: (result: U, error?: any) => void): () => void;
    readonly changeTrackingType: ChangeTrackingType
}

export type QuerySubscription<TEntity extends {}, U> = {
    id: string,
    query: Query<TEntity>;
    shape: (data: TEntity[]) => U;
    done: (result: U, error?: any) => void;
};