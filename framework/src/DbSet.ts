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
        this.changeTracker.add(entities, (r, e) => this._resolveMany(r, e, done));
    }

    addAsync(...entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.add(entities, (r, e) => {
                if (e != null) {
                    reject(e);
                    return;
                }

                resolve(r)
            });
        });
    }

    // also need to remove by id
    remove(entities: NonNullEntity<TEntity>[], done: EntityCallbackMany<TEntity>) {

    }

    removeAsync(...entities: NonNullEntity<TEntity>[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.remove(entities, (r, e) => {
                if (e != null) {
                    reject(e);
                    return;
                }

                resolve(r)
            });
        });
    }

    find(selector: EntitySelector<TEntity>, done: EntityCallbackOne<TEntity>) {
        this._dbPlugin.all<NonNullEntity<TEntity>>(
            this.schema.tableName,
            (r, e) => this._resolveOne(r, e, done, selector)
        );
    }

    findAsync(selector: EntitySelector<TEntity>) {
        return new Promise<NonNullEntity<TEntity> | null>((resolve, reject) => {
            this.find(selector, (r, e) => {
                if (e != null) {
                    reject(e);
                    return;
                }

                resolve(r)
            });
        });
    }

    // needed for queries, otherwise we need to use eval
    useParams<T>(params: T) {

        const paramsSelectors = {
            filter: (selector: EntityParamsSelector<TEntity, T>, done: EntityCallbackMany<TEntity>) => {
                const expression = toExpression(selector, params);

                this._dbPlugin.query<NonNullEntity<TEntity>>(
                    expression,
                    (r, e) => this._resolveMany(r, e, done)
                );
            },
            first: (done: EntityCallbackOne<TEntity>) => {
                // pass null for expression for first  ??
                this._dbPlugin.all<NonNullEntity<TEntity>>(
                    this.schema.tableName,
                    (r, e) => this._resolveOne(r, e, done)
                );
            },
            find: (selector: EntityParamsSelector<TEntity, T>, done: EntityCallbackOne<TEntity>) => {
                const expression = toExpression(selector, params);

                this._dbPlugin.query<NonNullEntity<TEntity>>(
                    expression,
                    (r, e) => this._resolveOne(r, e, done)
                );
            },
            pluck: <TKey extends keyof NonNullEntity<TEntity>>(selector: EntityParamsSelector<TEntity, T>, propertyName: TKey, done: (value: NonNullEntity<TEntity>[TKey] | null, error?: any) => void) => {
                const expression = toExpression(selector, params);

                this._dbPlugin.query<NonNullEntity<TEntity>>(
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
                    paramsSelectors.filter(selector, (r, e) => {
                        if (e != null) {
                            reject(e);
                            return
                        }

                        resolve(r);
                    });
                })
            },
            find: paramsSelectors.find,
            findAsync: (selector: EntityParamsSelector<TEntity, T>) => {
                return new Promise<NonNullEntity<TEntity> | null>((resolve, reject) => {
                    paramsSelectors.find(selector, (r, e) => {
                        if (e != null) {
                            reject(e);
                            return
                        }

                        resolve(r);
                    });
                })
            },
            pluck: paramsSelectors.pluck,
            pluckAsync: <TKey extends keyof NonNullEntity<TEntity>>(selector: EntityParamsSelector<TEntity, T>, propertyName: TKey) => {
                return new Promise<NonNullEntity<TEntity>[TKey] | null>((resolve, reject) => {
                    paramsSelectors.pluck(selector, propertyName, (r, e) => {
                        if (e != null) {
                            reject(e);
                            return
                        }

                        resolve(r);
                    });
                })
            }
        }
    }

    filter(selector: EntitySelector<TEntity>, done: EntityCallbackMany<TEntity>) {
        this._dbPlugin.all<NonNullEntity<TEntity>>(
            this.schema.tableName,
            (r, e) => this._resolveMany(r, e, done, selector)
        );
    }

    filterAsync(selector: EntitySelector<TEntity>) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.filter(selector, (r, e) => {
                if (e != null) {
                    reject(e);
                    return
                }

                resolve(r);
            });
        });
    }

    get(ids: IdType[], done: EntityCallbackMany<TEntity>) {
        this._dbPlugin.get<NonNullEntity<TEntity>>(
            this.schema.tableName,
            ids,
            (r, e) => this._resolveMany(r, e, done)
        );
    }

    getAsync(...ids: IdType[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.get(ids, (r, e) => {
                if (e != null) {
                    reject(e);
                    return
                }

                resolve(r);
            });
        });
    }

    pluck<TKey extends keyof NonNullEntity<TEntity>>(selector: EntitySelector<TEntity>, propertyName: TKey, done: (value: NonNullEntity<TEntity>[TKey] | null, error?: any) => void) {
        this._dbPlugin.all<NonNullEntity<TEntity>>(
            this.schema.tableName,
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

    pluckAsync<TKey extends keyof NonNullEntity<TEntity>>(selector: EntitySelector<TEntity>, propertyName: TKey, resolve: (value: NonNullEntity<TEntity>[TKey] | null, error?: any) => void) {
        return new Promise<NonNullEntity<TEntity>[TKey] | null>((resolve, reject) => {
            this.pluck(selector, propertyName, resolve);
        });
    }

    private _resolveMany(entities: NonNullEntity<TEntity>[], error: any, done: (entities: NonNullEntity<TEntity>[], error?: any) => void, selector?: EntitySelector<TEntity>) {
        // run post select operations

        if (selector != null) {
            done(entities.filter(selector), error)
            return
        }

        done(entities, error);
    }

    private _resolveOne(entities: NonNullEntity<TEntity>[], error: any, done: (entity: NonNullEntity<TEntity> | null, error?: any) => void, selector?: EntitySelector<TEntity>) {
        // run enrichers

        // on save we want to run our striping functions to ensure functions are not saved into the database

        if (entities.length === 0) {
            done(null);
            return;
        }

        done(entities[0]);
    }
}