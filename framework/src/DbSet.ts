import { IChangeTracker } from "./change-tracking/types";
import { ChangeTrackerFactory } from "./change-tracking/ChangeTrackerFactory";
import { CompiledSchema } from "@agrejus/db-framework-core";
import { EntityCallbackMany, EntitySelector, EntityCallbackOne, EntityParamsSelector } from "./types";
import { IDbPlugin, IdType, NonNullCreateEntity, NonNullEntity, toExpression } from '@agrejus/db-framework-core';

export class DbSet<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> {

    readonly changeTracker: IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>;
    public readonly schema: CompiledSchema<TEntity>;
    private readonly _dbPlugin: IDbPlugin;

    constructor(
        dbPlugin: IDbPlugin,
        schema: CompiledSchema<TEntity>
    ) {
        this._dbPlugin = dbPlugin;
        this.changeTracker = ChangeTrackerFactory.create<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(schema, dbPlugin);
        this.schema = schema;
    }

    add(entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[], done: EntityCallbackMany<TEntity>) {
        this.changeTracker.add(entities, done);
    }

    addAsync(...entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.add(entities, (r, e) => this._resolvePromise(r, e, resolve, reject));
        });
    }

    // also need to remove by id
    remove(entities: NonNullEntity<TEntity>[], done: EntityCallbackMany<TEntity>) {
        this.changeTracker.remove(entities, done);
    }

    removeAsync(...entities: NonNullEntity<TEntity>[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.remove(entities, (r, e) => this._resolvePromise(r, e, resolve, reject));
        });
    }

    find(selector: EntitySelector<TEntity>, done: EntityCallbackOne<TEntity>) {
        this._dbPlugin.all<TEntity>(
            this.schema,
            (r, e) => this._resolveOne(r, e, done, selector)
        );
    }

    findAsync(selector: EntitySelector<TEntity>) {
        return new Promise<NonNullEntity<TEntity> | null>((resolve, reject) => {
            this.find(selector, (r, e) => this._resolvePromise(r, e, resolve, reject));
        });
    }

    // needed for queries, otherwise we need to use eval
    useParams<T>(params: T) {

        const paramsSelectors = {
            filter: (selector: EntityParamsSelector<TEntity, T>, done: EntityCallbackMany<TEntity>) => {
                const expression = toExpression(selector, params);

                this._dbPlugin.query<TEntity>(
                    this.schema,
                    expression,
                    (r, e) => this._resolveMany(r, e, done)
                );
            },
            first: (done: EntityCallbackOne<TEntity>) => {
                // pass null for expression for first  ??
                this._dbPlugin.all<TEntity>(
                    this.schema,
                    (r, e) => this._resolveOne(r, e, done)
                );
            },
            find: (selector: EntityParamsSelector<TEntity, T>, done: EntityCallbackOne<TEntity>) => {
                const expression = toExpression(selector, params);

                this._dbPlugin.query<TEntity>(
                    this.schema,
                    expression,
                    (r, e) => this._resolveOne(r, e, done)
                );
            },
            pluck: <TKey extends keyof NonNullEntity<TEntity>>(selector: EntityParamsSelector<TEntity, T>, propertyName: TKey, done: (value: NonNullEntity<TEntity>[TKey] | null, error?: any) => void) => {
                const expression = toExpression(selector, params);

                this._dbPlugin.query<TEntity>(
                    this.schema,
                    expression,
                    (r, e) => {
                        const found = r.length > 0 ? r[0] : null;

                        if (found != null) {
                            done(e[propertyName]);
                            return;
                        }

                        done(null);
                    }
                );
            }
        }

        return {
            filter: paramsSelectors.filter,
            filterAsync: (selector: EntityParamsSelector<TEntity, T>) => {
                return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
                    paramsSelectors.filter(selector, (r, e) => this._resolvePromise(r, e, resolve, reject));
                })
            },
            find: paramsSelectors.find,
            findAsync: (selector: EntityParamsSelector<TEntity, T>) => {
                return new Promise<NonNullEntity<TEntity> | null>((resolve, reject) => {
                    paramsSelectors.find(selector, (r, e) => this._resolvePromise(r, e, resolve, reject));
                })
            },
            pluck: paramsSelectors.pluck,
            pluckAsync: <TKey extends keyof NonNullEntity<TEntity>>(selector: EntityParamsSelector<TEntity, T>, propertyName: TKey) => {
                return new Promise<NonNullEntity<TEntity>[TKey] | null>((resolve, reject) => {
                    paramsSelectors.pluck(selector, propertyName, (r, e) => this._resolvePromise(r, e, resolve, reject));
                })
            }
        }
    }

    filter(selector: EntitySelector<TEntity>, done: EntityCallbackMany<TEntity>) {
        this._dbPlugin.all<TEntity>(
            this.schema,
            (r, e) => this._resolveMany(r, e, done, selector)
        );
    }

    filterAsync(selector: EntitySelector<TEntity>) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.filter(selector, (r, e) => this._resolvePromise(r, e, resolve, reject));
        });
    }

    get(ids: IdType[], done: EntityCallbackMany<TEntity>) {
        this._dbPlugin.get<TEntity>(
            this.schema,
            ids,
            (r, e) => this._resolveMany(r, e, done)
        );
    }

    getAsync(...ids: IdType[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.get(ids, (r, e) => this._resolvePromise(r, e, resolve, reject));
        });
    }

    pluck<TKey extends keyof NonNullEntity<TEntity>>(selector: EntitySelector<TEntity>, propertyName: TKey, done: (value: NonNullEntity<TEntity>[TKey] | null, error?: any) => void) {
        this._dbPlugin.all<TEntity>(
            this.schema,
            (r, e) => {
                const found = r.length > 0 ? r[0] : null;

                if (found != null) {
                    const enriched = this.schema.enrich(found)
                    const resolved = this.changeTracker.resolve([enriched]);
                    done(resolved[0][propertyName]);
                    return;
                }

                done(null);
            }
        );
    }

    pluckAsync<TKey extends keyof NonNullEntity<TEntity>>(selector: EntitySelector<TEntity>, propertyName: TKey, resolve: (value: NonNullEntity<TEntity>[TKey] | null, error?: any) => void) {
        return new Promise<NonNullEntity<TEntity>[TKey] | null>((resolve, reject) => {
            this.pluck(selector, propertyName, (r, e) => this._resolvePromise(r, e, resolve, reject));
        });
    }

    private _resolvePromise<R>(data: R, error: any | undefined, resolve: (data: R) => void, reject: (error?: any) => void) {
        if (error != null) {
            reject(error);
            return
        }

        resolve(data);
    }

    private _resolveMany(entities: NonNullEntity<TEntity>[], error: any, done: (entities: NonNullEntity<TEntity>[], error?: any) => void, selector?: EntitySelector<TEntity>) {

        const enriched = entities.map(w => this.schema.enrich(w));
        const resolved = this.changeTracker.resolve(enriched);

        if (selector != null) {
            done(resolved.filter(selector), error)
            return
        }

        done(resolved, error);
    }

    private _resolveOne(entities: NonNullEntity<TEntity>[], error: any, done: (entity: NonNullEntity<TEntity> | null, error?: any) => void, selector?: EntitySelector<TEntity>) {

        const enriched = entities.map(w => this.schema.enrich(w));

        if (enriched.length === 0) {
            done(null, error);
            return;
        }
        
        if (selector != null) {
            const filtered = enriched.filter(selector);

            if (filtered.length === 0) {
                done(null, error);
                return;
            }

            const first = filtered[0];
            const resolved = this.changeTracker.resolve([first]);
    
            done(resolved[0], error);
            return;
        }

        const first = enriched[0];
        const resolved = this.changeTracker.resolve([first]);

        done(resolved[0], error);
    }
}