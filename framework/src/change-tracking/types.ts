import { NonNullCreateEntity, NonNullEntity } from "@agrejus/db-framework-core";
import { EntityCallbackMany, Filter } from '../types'

export interface IChangeTracker<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> {
    add(entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[], done: EntityCallbackMany<TEntity>): void;
    remove(entities: NonNullEntity<TEntity>[], done: EntityCallbackMany<TEntity>): void;
    saveChanges(done: (result: number, error?: any) => void): void;
    resolve(entities: NonNullEntity<TEntity>[]): NonNullEntity<TEntity>[];
    hasChanges(): boolean;
    subscribe(onChange: (entities: NonNullEntity<TEntity>[]) => void): () => void;
    subscribe(selector: Filter<NonNullEntity<TEntity>>, onChange: (entities: NonNullEntity<TEntity>[]) => void): () => void;
}

export type ChangeSubscription<TEntity extends {}> = { id: string, selector?: Filter<NonNullEntity<TEntity>>, onChange: (entities: NonNullEntity<TEntity>[]) => void };