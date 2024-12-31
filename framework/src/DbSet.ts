import { IChangeTracker } from "./change-tracking/types";
import { ChangeTrackerFactory } from "./change-tracking/ChangeTrackerFactory";
import { CompiledSchema } from "@agrejus/db-framework-core";
import { EntityCallbackMany } from "./types";
import { IDbPlugin, NonNullCreateEntity, NonNullEntity } from '@agrejus/db-framework-core';
import { Queryable } from './query/Queryable';

export class DbSet<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> extends Queryable<NonNullEntity<TEntity>> {

    readonly changeTracker: IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>;

    constructor(dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>) {
        super(null, schema as any, dbPlugin);
        this.changeTracker = ChangeTrackerFactory.create<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(schema, dbPlugin);
    }

    add(entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[], done: EntityCallbackMany<TEntity>) {
        this.changeTracker.add(entities, done);
    }

    addAsync(...entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.add(entities, (r, e) => this._resolvePromise(r, e, resolve, reject));
        });
    }

    remove(entities: NonNullEntity<TEntity>[], done: EntityCallbackMany<TEntity>) {
        this.changeTracker.remove(entities, done);
    }

    removeAsync(...entities: NonNullEntity<TEntity>[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.remove(entities, (r, e) => this._resolvePromise(r, e, resolve, reject));
        });
    }

    // subscribe(selector: EntitySelector<TEntity>, onChange: (entities: NonNullEntity<TEntity>[]) => void) {

    // }

    private _resolvePromise<R>(data: R, error: any | undefined, resolve: (data: R) => void, reject: (error?: any) => void) {
        if (error != null) {
            reject(error);
            return
        }

        resolve(data);
    }
}