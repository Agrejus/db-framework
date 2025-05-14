import { DbSetOptions, DbSetPipelines, EntityCallbackMany, EntityMap, QueryResult, SaveChangesContextStepFive, SaveChangesContextStepFour, SaveChangesContextStepOne, SaveChangesContextStepSix, SaveChangesContextStepThree, SaveChangesContextStepTwo } from "../types";
import { IDbPlugin, InferCreateType, InferType, Filter, ParamsFilter, CompiledSchema, InferMappedType } from '@agrejus/db-framework-core';
import { Queryable } from '../query/Queryable';
import { QueryableAsync } from '../query/QueryableAsync';
import { ParamsQueryableAsync } from "../query/ParamsQueryableAsync";
import { SelectionQueryable } from "../query/SelectionQueryable";
import { SelectionQueryableAsync } from "../query/SelectionQueryableAsync";
import { ChangeTracker } from '../change-tracking/ChangeTracker';
import { DataBridge } from '../data-access/DataBridge';
import { UniDirectionalSubscription } from '../subscriptions/UniDirectionalSubscription';
import { ChangeTrackingType } from "@agrejus/db-framework-core/dist/schema";

export class DbSet<TEntity extends {}> {

    protected readonly changeTracker: ChangeTracker<TEntity>;
    protected readonly dataBridge: DataBridge<TEntity>;
    readonly schema: CompiledSchema<TEntity>;
    protected unidirecitonalSubscription: UniDirectionalSubscription<TEntity>;

    constructor(
        dbPlugin: IDbPlugin,
        schema: CompiledSchema<TEntity>,
        options: DbSetOptions,
        pipelines: DbSetPipelines
    ) {

        this.unidirecitonalSubscription = new UniDirectionalSubscription(schema.key, options.signal);
        this.schema = schema;
        this.changeTracker = ChangeTracker.create<TEntity>(schema);
        this.dataBridge = DataBridge.create<TEntity>(schema, dbPlugin, options);

        pipelines.save.pipe(this.checkForChangesStep.bind(this))
            .pipe(this.prepareAdditions.bind(this))
            .pipe(this.prepareRemovals.bind(this))
            .pipe(this.prepareUpdates.bind(this))
            .pipe(this.persist.bind(this))
            .pipe(this.postOps.bind(this))
            .pipe(this.notifySubscribers.bind(this))
            .pipe(this.cleanup.bind(this));

        pipelines.hasChanges.pipe(this.hasChanges.bind(this))
    }

    protected get changeTrackingType(): ChangeTrackingType {
        return "entity";
    }

    protected hasChanges(payload: { hasChanges: boolean }, done: (payload: { hasChanges: boolean }) => void) {

        if (payload.hasChanges === true) {
            done(payload);
            return;
        }

        done({
            hasChanges: this.changeTracker.hasChanges()
        });
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

            // we only want to notify of changes when an item that was saved matches the query
            const updates = [...data.updates].map(w => w[1].doc);
            const removals = data.removes;
            const adds = data.result.adds;

            const changes: InferType<TEntity>[] = [
                ...updates,
                ...removals,
                ...adds as InferType<TEntity>[]
            ];

            this.unidirecitonalSubscription.send(changes);
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

        this.changeTracker.mergeChanges(data.result, { find: data.find, adds: data.adds })

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

    add(entities: InferCreateType<TEntity>[], done: EntityCallbackMany<TEntity>) {
        return this.changeTracker.add(entities, done);
    }

    addAsync(...entities: InferCreateType<TEntity>[]) {
        return new Promise<InferType<TEntity>[]>((resolve, reject) => {
            this.add(entities as any, (r, e) => this._resolvePromise(r, e, resolve as any, reject));
        });
    }

    remove(entities: InferType<TEntity>[], done: EntityCallbackMany<TEntity>) {
        this.changeTracker.remove(entities, done);
    }

    removeAsync(...entities: InferType<TEntity>[]) {
        return new Promise<InferType<TEntity>[]>((resolve, reject) => {
            this.remove(entities, (r, e) => this._resolvePromise(r, e, resolve, reject));
        });
    }

    subscribe() {
        const queryable = new Queryable<InferType<TEntity>, () => void>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return queryable.subscribe();
    }

    where(expression: Filter<InferType<TEntity>>): QueryableAsync<InferType<TEntity>>;
    where<P extends {}>(selector: ParamsFilter<InferType<TEntity>, P>, params: P): ParamsQueryableAsync<InferType<TEntity>>;
    where<P extends {} = never>(selector: ParamsFilter<InferType<TEntity>, P> | Filter<InferType<TEntity>>, params?: P) {

        if (params == null) {
            const queryable = new QueryableAsync<InferType<TEntity>>({
                dataBridge: this.dataBridge as any,
                changeTracker: this.changeTracker as any
            });
            return queryable.where(selector as Filter<InferType<TEntity>>);
        }

        const queryable = new ParamsQueryableAsync<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return queryable.where(selector as ParamsFilter<InferType<TEntity>, P>, params);
    }

    sort(selector: EntityMap<InferType<TEntity>, InferType<TEntity>[keyof InferType<TEntity>]>) {
        const result = new QueryableAsync<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.order(selector);
    }

    sortDescending(selector: EntityMap<InferType<TEntity>, InferType<TEntity>[keyof InferType<TEntity>]>) {
        const result = new QueryableAsync<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.orderDescending(selector);
    }

    map<R extends TEntity[keyof TEntity] | {}>(expression: EntityMap<TEntity, R>) {
        const result = new QueryableAsync<TEntity>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.map(expression);
    }

    skip(amount: number) {
        const result = new QueryableAsync<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.skip(amount);
    }

    take(amount: number) {
        const result = new QueryableAsync<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.take(amount);
    }

    toArray(done: QueryResult<InferType<TEntity>[]>) {
        const result = new SelectionQueryable<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.toArray(done);
    }

    toArrayAsync(): Promise<InferType<TEntity>[]> {
        const result = new SelectionQueryableAsync<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });
        return result.toArrayAsync();
    }

    first(expression: Filter<InferType<TEntity>>, done: QueryResult<InferType<TEntity>>): void;
    first<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P, done: QueryResult<InferType<TEntity>>): void;
    first(done: QueryResult<InferType<TEntity>>): void;
    first<P extends {} = never>(doneOrExpression: Filter<InferType<TEntity>> | ParamsFilter<TEntity, P> | QueryResult<InferType<TEntity>>, paramsOrDone?: P | QueryResult<InferType<TEntity>>, done?: QueryResult<InferType<TEntity>>) {
        const result = new SelectionQueryable<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.first(doneOrExpression as any, paramsOrDone, done);
    }

    firstAsync(expression: Filter<InferType<TEntity>>): Promise<InferType<TEntity>>;
    firstAsync<P extends {}>(expression: ParamsFilter<InferType<TEntity>, P>, params: P): Promise<InferType<TEntity>>;
    firstAsync(): Promise<InferType<TEntity>>;
    firstAsync<P extends {} = never>(expression?: Filter<InferType<TEntity>> | ParamsFilter<InferType<TEntity>, P>, params?: P): Promise<InferType<TEntity>> {
        const result = new SelectionQueryableAsync<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.firstAsync(expression as any, params);
    }

    firstOrUndefined(expression: Filter<InferType<TEntity>>, done: QueryResult<InferType<TEntity> | undefined>): void;
    firstOrUndefined<P extends {}>(expression: ParamsFilter<InferType<TEntity>, P>, params: P, done: QueryResult<InferType<TEntity> | undefined>): void;
    firstOrUndefined(done: QueryResult<InferType<TEntity> | undefined>): void;
    firstOrUndefined<P extends {} = never>(doneOrExpression: Filter<InferType<TEntity>> | ParamsFilter<InferType<TEntity>, P> | QueryResult<InferType<TEntity> | undefined>, paramsOrDone?: P | QueryResult<InferType<TEntity> | undefined>, done?: QueryResult<InferType<TEntity> | undefined>) {
        const result = new SelectionQueryable<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.firstOrUndefined(doneOrExpression as any, paramsOrDone, done);
    }

    firstOrUndefinedAsync(expression: Filter<InferType<TEntity>>): Promise<InferType<TEntity> | undefined>;
    firstOrUndefinedAsync<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P): Promise<InferType<TEntity> | undefined>;
    firstOrUndefinedAsync(): Promise<InferType<TEntity> | undefined>;
    firstOrUndefinedAsync<P extends {} = never>(expression?: Filter<InferType<TEntity>> | ParamsFilter<TEntity, P>, params?: P): Promise<InferType<TEntity> | undefined> {
        const result = new SelectionQueryableAsync<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.firstOrUndefinedAsync(expression as any, params);
    }

    some(expression: Filter<InferType<TEntity>>, done: QueryResult<boolean>): void;
    some<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P, done: QueryResult<boolean>): void;
    some(done: QueryResult<boolean>): void;
    some<P extends {} = never>(doneOrExpression: Filter<InferType<TEntity>> | ParamsFilter<TEntity, P> | QueryResult<boolean>, paramsOrDone?: P | QueryResult<boolean>, done?: QueryResult<boolean>) {
        const result = new SelectionQueryable<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.some(doneOrExpression as any, paramsOrDone, done);
    }

    someAsync(expression: Filter<InferType<TEntity>>): Promise<boolean>;
    someAsync<P extends {}>(expression: ParamsFilter<InferType<TEntity>, P>, params: P): Promise<boolean>;
    someAsync(): Promise<boolean>;
    someAsync<P extends {} = never>(expression?: Filter<InferType<TEntity>> | ParamsFilter<InferType<TEntity>, P>, params?: P): Promise<boolean> {
        const result = new SelectionQueryableAsync<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.someAsync(expression as any, params);
    }

    every(expression: Filter<InferType<TEntity>>, done: QueryResult<boolean>): void;
    every<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P, done: QueryResult<boolean>): void;
    every<P extends {} = never>(expression: Filter<InferType<TEntity>> | ParamsFilter<TEntity, P> | QueryResult<boolean>, paramsOrDone?: P | QueryResult<boolean>, done?: QueryResult<boolean>) {
        const result = new SelectionQueryable<InferType<TEntity>>({
            dataBridge: this.dataBridge as any,
            changeTracker: this.changeTracker as any
        });

        return result.every(expression as any, paramsOrDone, done);
    }

    everyAsync(expression: Filter<InferType<TEntity>>): Promise<boolean>;
    everyAsync<P extends {}>(expression: ParamsFilter<TEntity, P>, params: P): Promise<boolean>;
    everyAsync<P extends {} = never>(expression?: Filter<InferType<TEntity>> | ParamsFilter<TEntity, P>, params?: P): Promise<boolean> {
        const result = new SelectionQueryableAsync<InferType<TEntity>>({
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