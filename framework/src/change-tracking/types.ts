import { NonNullCreateEntity } from "@agrejus/db-framework-core";
import { EntityCallbackMany } from '../types'

export interface IChangeTracker<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> {
    add(entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[], done: EntityCallbackMany<TEntity>): void;
    saveChanges(done: (result: number, error?: any) => void): void;
}