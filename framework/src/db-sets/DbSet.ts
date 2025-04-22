import { DbSetOptions, EntityCallbackMany, EntityMap, QueryResult, SaveChangesContextStepFive, SaveChangesContextStepFour, SaveChangesContextStepOne, SaveChangesContextStepSix, SaveChangesContextStepThree, SaveChangesContextStepTwo } from "../types";
import { IDbPlugin, NonNullCreateEntity, NonNullEntity, Filter, ParamsFilter, CompiledSchema } from '@agrejus/db-framework-core';
import { Queryable } from '../query/Queryable';
import { QueryableAsync } from '../query/QueryableAsync';
import { ParamsQueryableAsync } from "../query/ParamsQueryableAsync";
import { SelectionQueryable } from "../query/SelectionQueryable";
import { SelectionQueryableAsync } from "../query/SelectionQueryableAsync";
import { TrampolinePipeline } from "../TrampolinePipeline";
import { ChangeTracker } from '../change-tracking/ChangeTracker';
import { DataBridge } from '../data-access/DataBridge';


export class DbSet<TEntity extends {}> {

    // strategies
    //  - persist
    //  - read
    //  - notificaiton
    // Given the same data, how can we interact with it differently

    protected readonly changeTracker: ChangeTracker<TEntity>;
    protected readonly dataBridge: DataBridge<TEntity>;
    readonly schema: CompiledSchema<TEntity>;

    constructor(
        dbPlugin: IDbPlugin,
        schema: CompiledSchema<TEntity>,
        options: DbSetOptions,
        saveChangesPipeline: TrampolinePipeline<SaveChangesContextStepOne>
    ) {

        this.schema = schema;
        this.changeTracker = ChangeTracker.create<TEntity>(schema);
        this.dataBridge = DataBridge.create<TEntity>(schema, dbPlugin, options);

        saveChangesPipeline.pipe(this.checkForChangesStep.bind(this))
            .pipe(this.prepareAdditions.bind(this))
            .pipe(this.prepareRemovals.bind(this))
            .pipe(this.prepareUpdates.bind(this))
            .pipe(this.persist.bind(this))
            .pipe(this.postOps.bind(this))
            .pipe(this.notifySubscribers.bind(this))
            .pipe(this.cleanup.bind(this))
    }

    protected prepareAdditions(data: SaveChangesContextStepTwo, done: (result: SaveChangesContextStepThree<TEntity>) => void) {

        if (data.hasChanges === false) {
            done({
                ...data,
                adds: [],
                find: () => undefined as any
            })
            return;
        }

        const { adds, find } = this.changeTracker.prepareAdditions();

        done({
            ...data,
            adds,
            find
        });
    }

    protected checkForChangesStep(data: SaveChangesContextStepOne, done: (result: SaveChangesContextStepTwo) => void) {

        const hasChanges = this.changeTracker.hasChanges();

        // only carry data.count over
        done({
            count: data.count,
            hasChanges
        });
    }

    protected cleanup(data: SaveChangesContextStepSix<TEntity>, done: (result: SaveChangesContextStepOne, error?: any) => void) {

        this.changeTracker.clearAdditions();

        if (data.result == null) {
            done({ count: data.count });
            return;
        }

        data.count += data.result.adds.length + data.result.removedCount + data.result.updates.length;

        done({ count: data.count });
    }

    protected notifySubscribers(data: SaveChangesContextStepSix<TEntity>, done: (result: SaveChangesContextStepSix<TEntity>) => void) {

        if (data.hasChanges === true) {
            // this.unidirecitonalSubscription.send();
        }

        done(data);
    }

    protected prepareUpdates(data: SaveChangesContextStepFour<TEntity>, done: (result: SaveChangesContextStepFive<TEntity>) => void) {

        if (data.hasChanges === false) {
            done({ ...data, updates: new Map() });
            return;
        }

        const updates = this.changeTracker.getAttachmentsChanges();

        done({ ...data, updates });
    }

    protected postOps(data: SaveChangesContextStepSix<TEntity>, done: (result: SaveChangesContextStepSix<TEntity>, error?: any) => void) {

        if (data.result == null) {
            done(data)
            return;
        }

        this.changeTracker.mergeChanges(data.result, { find: data.find, adds: [] })

        done(data);
    }

    protected persist(data: SaveChangesContextStepFive<TEntity>, done: (result: SaveChangesContextStepSix<TEntity>, error?: any) => void) {

        if (data.hasChanges === false) {
            done({ ...data, result: null });
            return;
        }

        this.dataBridge.bulkOperations(this.schema, {
            // prepare is responsible for creating a new clean object 
            // with only properties that should be saved and run any serializers
            adds: data.adds,
            removes: data.removes,
            updates: data.updates
        }, (result, error) => done({ ...data, result }, error));
    }

    protected prepareRemovals(data: SaveChangesContextStepThree<TEntity>, done: (result: SaveChangesContextStepFour<TEntity>) => void) {

        if (data.hasChanges === false) {
            done({ ...data, removes: [] });
            return;
        }

        const removes = this.changeTracker.prepareRemovals();

        done({ ...data, removes });
    }

    add(entities: NonNullCreateEntity<TEntity>[], done: EntityCallbackMany<TEntity>) {
        this.changeTracker.add(entities, done);
    }

    addAsync(...entities: NonNullCreateEntity<TEntity>[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.add(entities as any, (r, e) => this._resolvePromise(r, e, resolve as any, reject));
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
        const queryable = new Queryable<NonNullEntity<TEntity>, () => void>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return queryable.subscribe();
    }

    where(expression: Filter<NonNullEntity<TEntity>>): QueryableAsync<NonNullEntity<TEntity>>;
    where<P extends {}>(selector: ParamsFilter<NonNullEntity<TEntity>, P>, params: P): ParamsQueryableAsync<NonNullEntity<TEntity>>;
    where<P extends {} = never>(selector: ParamsFilter<NonNullEntity<TEntity>, P> | Filter<NonNullEntity<TEntity>>, params?: P) {

        if (params == null) {
            const queryable = new QueryableAsync<NonNullEntity<TEntity>>({
                dataBridge: this.dataBridge as any,
                changeTracker: this.changeTracker as any
            });
            return queryable.where(selector as Filter<NonNullEntity<TEntity>>);
        }

        const queryable = new ParamsQueryableAsync<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return queryable.where(selector as ParamsFilter<NonNullEntity<TEntity>, P>, params);
    }

    sort(selector: EntityMap<TEntity, TEntity[keyof TEntity]>) {
        const result = new QueryableAsync<TEntity>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.order(selector);
    }

    sortDescending(selector: EntityMap<TEntity, TEntity[keyof TEntity]>) {
        const result = new QueryableAsync<TEntity>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.orderDescending(selector);
    }

    map<R extends NonNullEntity<TEntity>[keyof NonNullEntity<TEntity>] | Partial<NonNullEntity<TEntity>>>(expression: EntityMap<NonNullEntity<TEntity>, R>) {
        const result = new QueryableAsync<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.map(expression);
    }

    skip(amount: number) {
        const result = new QueryableAsync<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.skip(amount);
    }

    take(amount: number) {
        const result = new QueryableAsync<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.take(amount);
    }

    toArray(done: QueryResult<NonNullEntity<TEntity>[]>) {
        const result = new SelectionQueryable<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.toArray(done);
    }

    toArrayAsync(): Promise<NonNullEntity<TEntity>[]> {
        const result = new SelectionQueryableAsync<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.toArrayAsync();
    }

    first(expression: Filter<NonNullEntity<TEntity>>, done: QueryResult<NonNullEntity<TEntity>>): void;
    first<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P, done: QueryResult<NonNullEntity<TEntity>>): void;
    first(done: QueryResult<NonNullEntity<TEntity>>): void;
    first<P extends {} = never>(doneOrExpression: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P> | QueryResult<NonNullEntity<TEntity>>, paramsOrDone?: P | QueryResult<NonNullEntity<TEntity>>, done?: QueryResult<NonNullEntity<TEntity>>) {
        const result = new SelectionQueryable<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.first(doneOrExpression as any, paramsOrDone, done);
    }

    firstAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<NonNullEntity<TEntity>>;
    firstAsync<P extends {}>(expression: ParamsFilter<NonNullEntity<TEntity>, P>, params: P): Promise<NonNullEntity<TEntity>>;
    firstAsync(): Promise<NonNullEntity<TEntity>>;
    firstAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<NonNullEntity<TEntity>, P>, params?: P): Promise<NonNullEntity<TEntity>> {
        const result = new SelectionQueryableAsync<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.firstAsync(expression as any, params);
    }

    firstOrUndefined(expression: Filter<NonNullEntity<TEntity>>, done: QueryResult<NonNullEntity<TEntity> | undefined>): void;
    firstOrUndefined<P extends {}>(expression: ParamsFilter<NonNullEntity<TEntity>, P>, params: P, done: QueryResult<NonNullEntity<TEntity> | undefined>): void;
    firstOrUndefined(done: QueryResult<NonNullEntity<TEntity> | undefined>): void;
    firstOrUndefined<P extends {} = never>(doneOrExpression: Filter<NonNullEntity<TEntity>> | ParamsFilter<NonNullEntity<TEntity>, P> | QueryResult<NonNullEntity<TEntity> | undefined>, paramsOrDone?: P | QueryResult<NonNullEntity<TEntity> | undefined>, done?: QueryResult<NonNullEntity<TEntity> | undefined>) {
        const result = new SelectionQueryable<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.firstOrUndefined(doneOrExpression as any, paramsOrDone, done);
    }

    firstOrUndefinedAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<NonNullEntity<TEntity> | undefined>;
    firstOrUndefinedAsync<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P): Promise<NonNullEntity<TEntity> | undefined>;
    firstOrUndefinedAsync(): Promise<NonNullEntity<TEntity> | undefined>;
    firstOrUndefinedAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P>, params?: P): Promise<NonNullEntity<TEntity> | undefined> {
        const result = new SelectionQueryableAsync<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.firstOrUndefinedAsync(expression as any, params);
    }

    some(expression: Filter<NonNullEntity<TEntity>>, done: QueryResult<boolean>): void;
    some<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P, done: QueryResult<boolean>): void;
    some(done: QueryResult<boolean>): void;
    some<P extends {} = never>(doneOrExpression: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P> | QueryResult<boolean>, paramsOrDone?: P | QueryResult<boolean>, done?: QueryResult<boolean>) {
        const result = new SelectionQueryable<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.some(doneOrExpression as any, paramsOrDone, done);
    }

    someAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<boolean>;
    someAsync<P extends {}>(expression: ParamsFilter<NonNullEntity<TEntity>, P>, params: P): Promise<boolean>;
    someAsync(): Promise<boolean>;
    someAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<NonNullEntity<TEntity>, P>, params?: P): Promise<boolean> {
        const result = new SelectionQueryableAsync<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.someAsync(expression as any, params);
    }

    every(expression: Filter<NonNullEntity<TEntity>>, done: QueryResult<boolean>): void;
    every<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P, done: QueryResult<boolean>): void;
    every<P extends {} = never>(expression: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P> | QueryResult<boolean>, paramsOrDone?: P | QueryResult<boolean>, done?: QueryResult<boolean>) {
        const result = new SelectionQueryable<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.every(expression as any, paramsOrDone, done);
    }

    everyAsync(expression: Filter<NonNullEntity<TEntity>>): Promise<boolean>;
    everyAsync<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P): Promise<boolean>;
    everyAsync<P extends {} = never>(expression?: Filter<NonNullEntity<TEntity>> | ParamsFilter<TEntity, P>, params?: P): Promise<boolean> {
        const result = new SelectionQueryableAsync<NonNullEntity<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
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