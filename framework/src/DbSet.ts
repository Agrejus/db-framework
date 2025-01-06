import { IChangeTracker } from "./change-tracking/types";
import { ChangeTrackerFactory } from "./change-tracking/ChangeTrackerFactory";
import { CompiledSchema } from "@agrejus/db-framework-core";
import { EntityCallbackMany, EntityMap, Filter, ParamsFilter, QueryResult } from "./types";
import { IDbPlugin, NonNullCreateEntity, NonNullEntity } from '@agrejus/db-framework-core';
import { Queryable } from './query/Queryable';
import { ParamsQueryable } from "./query/ParamsQueryable";

export class DbSet<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> {

    readonly changeTracker: IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>;
    private readonly _dbPlugin: IDbPlugin;
    private readonly _schema: CompiledSchema<TEntity>;

    constructor(dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>) {
        this._dbPlugin = dbPlugin;
        this._schema = schema;
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

    subscribe(onChange: (entities: NonNullEntity<TEntity>[]) => void): () => void;
    subscribe(selector: Filter<NonNullEntity<TEntity>>, onChange: (entities: NonNullEntity<TEntity>[]) => void): () => void;
    subscribe(selectorOrOnChange: Filter<NonNullEntity<TEntity>> | ((entities: NonNullEntity<TEntity>[]) => void), onChange?: (entities: NonNullEntity<TEntity>[]) => void) {
        if (onChange == null) {
            const callback = selectorOrOnChange as (entities: NonNullEntity<TEntity>[]) => void;
            return this.changeTracker.subscribe(callback);
        }

        const selector = selectorOrOnChange as Filter<NonNullEntity<TEntity>>;
        return this.changeTracker.subscribe(selector, onChange);
    }

    where(expression: Filter<NonNullEntity<TEntity>>): Queryable<NonNullEntity<TEntity>>;
    where<P extends {}>(selector: ParamsFilter<NonNullEntity<TEntity>, P>, params: P): ParamsQueryable<NonNullEntity<TEntity>>;
    where<P extends {} = never>(selector: ParamsFilter<NonNullEntity<TEntity>, P> | Filter<NonNullEntity<TEntity>>, params?: P) {
        
        if (params == null) {
            const queryable = new Queryable<NonNullEntity<TEntity>>(null, { 
                changeTracker: this.changeTracker as IChangeTracker<any>, 
                schema: this._schema as any, 
                dbPlugin: this._dbPlugin 
            });
            queryable.where(selector as Filter<NonNullEntity<TEntity>>);
            return queryable;
        }

        const queryable = new ParamsQueryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        });
        queryable.where(selector as ParamsFilter<NonNullEntity<TEntity>, P>, params);
        return queryable;
    }

    sort(selector: EntityMap<TEntity, TEntity[keyof TEntity]>) {
        const result = new Queryable<TEntity>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        result.order(selector);
        return result;
    }

    sortDescending(selector: EntityMap<TEntity, TEntity[keyof TEntity]>) {
        const result = new Queryable<TEntity>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        result.orderDescending(selector);
        return result;
    }

    map<R extends NonNullEntity<TEntity>[keyof NonNullEntity<TEntity>] | Partial<NonNullEntity<TEntity>>>(expression: EntityMap<NonNullEntity<TEntity>, R>) {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        result.map(expression);
        return result;
    }

    skip(amount: number) {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        result.skip(amount);
        return result;
    }

    take(amount: number) {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        result.take(amount);
        return result;
    }

    // need the rest of the methods that return data
    toArray(done: QueryResult<NonNullEntity<TEntity>[]>) {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        result.toArray(done);
    }

    toArrayAsync(): Promise<NonNullEntity<TEntity>[]> {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        return result.toArrayAsync();
    }

    first(expression: Filter<NonNullEntity<TEntity>>, done: QueryResult<NonNullEntity<TEntity>>): void;
    first<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P, done: QueryResult<NonNullEntity<TEntity>>): void;
    first(done: QueryResult<NonNullEntity<TEntity>>): void;
    first<P extends {} = never>(doneOrExpression: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P> | QueryResult<NonNullEntity<TEntity>>, paramsOrDone?: P | QueryResult<NonNullEntity<TEntity>>, done?: QueryResult<NonNullEntity<TEntity>>) {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        result.first(doneOrExpression as any, paramsOrDone, done);
    }

    firstAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<NonNullEntity<TEntity>>;
    firstAsync<P extends {}>(expression: ParamsFilter<NonNullEntity<TEntity>, P>, params: P): Promise<NonNullEntity<TEntity>>;
    firstAsync(): Promise<NonNullEntity<TEntity>>;
    firstAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<NonNullEntity<TEntity>, P>, params?: P): Promise<NonNullEntity<TEntity>> {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        return result.firstAsync(expression as any, params);
    }

    firstOrUndefined(expression: Filter<NonNullEntity<TEntity>>, done: QueryResult<NonNullEntity<TEntity> | undefined>): void;
    firstOrUndefined<P extends {}>(expression: ParamsFilter<NonNullEntity<TEntity>, P>, params: P, done: QueryResult<NonNullEntity<TEntity> | undefined>): void;
    firstOrUndefined(done: QueryResult<NonNullEntity<TEntity> | undefined>): void;
    firstOrUndefined<P extends {} = never>(doneOrExpression: Filter<NonNullEntity<TEntity>> | ParamsFilter<NonNullEntity<TEntity>, P> | QueryResult<NonNullEntity<TEntity> | undefined>, paramsOrDone?: P | QueryResult<NonNullEntity<TEntity> | undefined>, done?: QueryResult<NonNullEntity<TEntity> | undefined>) {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        result.firstOrUndefined(doneOrExpression as any, paramsOrDone, done);
    }

    firstOrUndefinedAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<NonNullEntity<TEntity> | undefined>;
    firstOrUndefinedAsync<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P): Promise<NonNullEntity<TEntity> | undefined>;
    firstOrUndefinedAsync(): Promise<NonNullEntity<TEntity> | undefined>;
    firstOrUndefinedAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P>, params?: P): Promise<NonNullEntity<TEntity> | undefined> {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        return result.firstOrUndefinedAsync(expression as any, params);
    }

    some(expression: Filter<NonNullEntity<TEntity>>, done: QueryResult<boolean>): void;
    some<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P, done: QueryResult<boolean>): void;
    some(done: QueryResult<boolean>): void;
    some<P extends {} = never>(doneOrExpression: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P> | QueryResult<boolean>, paramsOrDone?: P | QueryResult<boolean>, done?: QueryResult<boolean>) {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        result.some(doneOrExpression as any, paramsOrDone, done);
    }

    someAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<boolean>;
    someAsync<P extends {}>(expression: ParamsFilter<NonNullEntity<TEntity>, P>, params: P): Promise<boolean>;
    someAsync(): Promise<boolean>;
    someAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<NonNullEntity<TEntity>, P>, params?: P): Promise<boolean> {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        return result.someAsync(expression as any, params);
    }

    every(expression: Filter<NonNullEntity<TEntity>>, done: QueryResult<boolean>): void;
    every<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P, done: QueryResult<boolean>): void;
    every<P extends {} = never>(expression: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P> | QueryResult<boolean>, paramsOrDone?: P | QueryResult<boolean>, done?: QueryResult<boolean>) {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        result.every(expression as any, paramsOrDone, done);
    }

    everyAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<boolean>;
    everyAsync<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P): Promise<boolean>;
    everyAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P>, params?: P): Promise<boolean> {
        const result = new Queryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        return result.everyAsync(expression as any, params);
    }

    private _resolvePromise<R>(data: R, error: any | undefined, resolve: (data: R) => void, reject: (error?: any) => void) {
        if (error != null) {
            reject(error);
            return
        }

        resolve(data);
    }

}