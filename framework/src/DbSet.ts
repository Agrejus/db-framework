import { IChangeTracker } from "./change-tracking/types";
import { ChangeTrackerFactory } from "./change-tracking/ChangeTrackerFactory";
import { CompiledSchema } from "@agrejus/db-framework-core";
import { EntityCallbackMany, EntityMap, Filter, GenericFunction, ParamsFilter, QueryResult } from "./types";
import { IDbPlugin, NonNullCreateEntity, NonNullEntity } from '@agrejus/db-framework-core';
import { Queryable } from './query/Queryable';
import { QueryableAsync } from './query/QueryableAsync';
import { ParamsQueryableAsync } from "./query/ParamsQueryableAsync";
import { SelectionQueryable } from "./query/SelectionQueryable";
import { SelectionQueryableAsync } from "./query/SelectionQueryableAsync";


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

    subscribe() {
        const queryable = new Queryable<NonNullEntity<TEntity>, () => void>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        });
        return queryable.subscribe();
    }

    where(expression: Filter<NonNullEntity<TEntity>>): QueryableAsync<NonNullEntity<TEntity>>;
    where<P extends {}>(selector: ParamsFilter<NonNullEntity<TEntity>, P>, params: P): ParamsQueryableAsync<NonNullEntity<TEntity>>;
    where<P extends {} = never>(selector: ParamsFilter<NonNullEntity<TEntity>, P> | Filter<NonNullEntity<TEntity>>, params?: P) {
        
        if (params == null) {
            const queryable = new QueryableAsync<NonNullEntity<TEntity>>(null, { 
                changeTracker: this.changeTracker as IChangeTracker<any>, 
                schema: this._schema as any, 
                dbPlugin: this._dbPlugin 
            });
            return queryable.where(selector as Filter<NonNullEntity<TEntity>>);
        }

        const queryable = new ParamsQueryableAsync<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        });
        return queryable.where(selector as ParamsFilter<NonNullEntity<TEntity>, P>, params);
    }

    sort(selector: EntityMap<TEntity, TEntity[keyof TEntity]>) {
        const result = new QueryableAsync<TEntity>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        return result.order(selector);
    }

    sortDescending(selector: EntityMap<TEntity, TEntity[keyof TEntity]>) {
        const result = new QueryableAsync<TEntity>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        return result.orderDescending(selector);
    }

    map<R extends NonNullEntity<TEntity>[keyof NonNullEntity<TEntity>] | Partial<NonNullEntity<TEntity>>>(expression: EntityMap<NonNullEntity<TEntity>, R>) {
        const result = new QueryableAsync<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        return result.map(expression);
    }

    skip(amount: number) {
        const result = new QueryableAsync<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        return result.skip(amount);
    }

    take(amount: number) {
        const result = new QueryableAsync<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        return result.take(amount);
    }

    toArray(done: QueryResult<NonNullEntity<TEntity>[]>) {
        const result = new SelectionQueryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 
        return result.toArray(done);
    }

    toArrayAsync(): Promise<NonNullEntity<TEntity>[]> {
        const result = new SelectionQueryableAsync<NonNullEntity<TEntity>>(null, { 
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
        const result = new SelectionQueryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        return result.first(doneOrExpression as any, paramsOrDone, done);
    }

    firstAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<NonNullEntity<TEntity>>;
    firstAsync<P extends {}>(expression: ParamsFilter<NonNullEntity<TEntity>, P>, params: P): Promise<NonNullEntity<TEntity>>;
    firstAsync(): Promise<NonNullEntity<TEntity>>;
    firstAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<NonNullEntity<TEntity>, P>, params?: P): Promise<NonNullEntity<TEntity>> {
        const result = new SelectionQueryableAsync<NonNullEntity<TEntity>>(null, { 
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
        const result = new SelectionQueryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        return result.firstOrUndefined(doneOrExpression as any, paramsOrDone, done);
    }

    firstOrUndefinedAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<NonNullEntity<TEntity> | undefined>;
    firstOrUndefinedAsync<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P): Promise<NonNullEntity<TEntity> | undefined>;
    firstOrUndefinedAsync(): Promise<NonNullEntity<TEntity> | undefined>;
    firstOrUndefinedAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P>, params?: P): Promise<NonNullEntity<TEntity> | undefined> {
        const result = new SelectionQueryableAsync<NonNullEntity<TEntity>>(null, { 
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
        const result = new SelectionQueryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        return result.some(doneOrExpression as any, paramsOrDone, done);
    }

    someAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<boolean>;
    someAsync<P extends {}>(expression: ParamsFilter<NonNullEntity<TEntity>, P>, params: P): Promise<boolean>;
    someAsync(): Promise<boolean>;
    someAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<NonNullEntity<TEntity>, P>, params?: P): Promise<boolean> {
        const result = new SelectionQueryableAsync<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        return result.someAsync(expression as any, params);
    }

    every(expression: Filter<NonNullEntity<TEntity>>, done: QueryResult<boolean>): void;
    every<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P, done: QueryResult<boolean>): void;
    every<P extends {} = never>(expression: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P> | QueryResult<boolean>, paramsOrDone?: P | QueryResult<boolean>, done?: QueryResult<boolean>) {
        const result = new SelectionQueryable<NonNullEntity<TEntity>>(null, { 
            changeTracker: this.changeTracker as IChangeTracker<any>, 
            schema: this._schema as any, 
            dbPlugin: this._dbPlugin 
        }); 

        return result.every(expression as any, paramsOrDone, done);
    }

    everyAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<boolean>;
    everyAsync<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P): Promise<boolean>;
    everyAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P>, params?: P): Promise<boolean> {
        const result = new SelectionQueryableAsync<NonNullEntity<TEntity>>(null, { 
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