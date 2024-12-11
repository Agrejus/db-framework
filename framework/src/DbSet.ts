import { ChangeTracker } from "./ChangeTracker";
import { CompiledSchema } from "@agrejus/db-framework-core";
import { EntityResolveMany, EntitySelector, EntityResolveOne, ErrorCallback, EntityParamsSelector } from "./types";
import { IDbPlugin, IdType, NonNullCreateEntity, NonNullEntity, toExpression } from '@agrejus/db-framework-core';

export class DbSet<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> {

    private readonly _changeTracker: ChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>;
    public readonly schema: CompiledSchema<TEntity>;
    private readonly _dbPlugin: IDbPlugin;

    constructor(
        dbPlugin: IDbPlugin,
        schema: CompiledSchema<TEntity>
    ) {
        this._dbPlugin = dbPlugin;
        this._changeTracker = new ChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(schema);
        this.schema = schema;
    }

    getChanges() {
        return this._changeTracker.getChanges();
    }

    add(entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[], resolve: EntityResolveMany<TEntity>, reject: ErrorCallback) {
        this._changeTracker.add(entities,
            (e) => this._resolveMany(resolve, e),
            (e) => this._reject(reject, e)
        );
    }

    addAsync(...entities: NonNullCreateEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.add(entities, resolve, reject);
        });
    }

    // also need to remove by id
    remove(entities: NonNullEntity<TEntity>[], resolve: EntityResolveMany<TEntity>, reject: ErrorCallback) {

    }

    removeAsync(...entities: NonNullEntity<TEntity>[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.remove(entities, resolve, reject);
        });
    }

    find(selector: EntitySelector<TEntity>, resolve: EntityResolveOne<TEntity>, reject: ErrorCallback) {
        this._dbPlugin.all<NonNullEntity<TEntity>>(
            this.schema.tableName,
            (e) => this._resolveOne(resolve, e, selector),
            (e) => this._reject(reject, e)
        );
    }

    findAsync(selector: EntitySelector<TEntity>) {
        return new Promise<NonNullEntity<TEntity> | null>((resolve, reject) => {
            this.find(selector, resolve, reject);
        });
    }

    first(resolve: EntityResolveOne<TEntity>, reject: ErrorCallback) {
        this._dbPlugin.all<NonNullEntity<TEntity>>(
            this.schema.tableName,
            (e) => this._resolveOne(resolve, e),
            (e) => this._reject(reject, e)
        );
    }

    firstAsync() {
        return new Promise<NonNullEntity<TEntity> | null>((resolve, reject) => {
            this.first(resolve, reject);
        });
    }

    // needed for queries, otherwise we need to use eval
    useParams<T>(params: T) {

        const paramsSelectors = {
            filter: (selector: EntityParamsSelector<TEntity, T>, resolve: EntityResolveMany<TEntity>, reject: ErrorCallback) => {
                const expression = toExpression(selector, params);

                this._dbPlugin.query<NonNullEntity<TEntity>>(
                    expression,
                    (e) => this._resolveMany(resolve, e),
                    (e) => this._reject(reject, e)
                );
            },
            first: (resolve: EntityResolveOne<TEntity>, reject: ErrorCallback) => {
                // pass null for expression for first  ??
                this._dbPlugin.all<NonNullEntity<TEntity>>(
                    this.schema.tableName,
                    (e) => this._resolveOne(resolve, e),
                    (e) => this._reject(reject, e)
                );
            },
            find: (selector: EntityParamsSelector<TEntity, T>, resolve: EntityResolveOne<TEntity>, reject: ErrorCallback) => {
                const expression = toExpression(selector, params);

                this._dbPlugin.query<NonNullEntity<TEntity>>(
                    expression,
                    (e) => this._resolveOne(resolve, e),
                    (e) => this._reject(reject, e)
                );
            },
            pluck: <TKey extends keyof NonNullEntity<TEntity>>(selector: EntityParamsSelector<TEntity, T>, propertyName: TKey, resolve: (value: NonNullEntity<TEntity>[TKey] | null) => void, reject: ErrorCallback) => {
                const expression = toExpression(selector, params);

                this._dbPlugin.query<NonNullEntity<TEntity>>(
                    expression,
                    (e) => this._resolveOne(e => resolve(e == null ? null : e[propertyName]), e),
                    (e) => this._reject(reject, e)
                );
            }
        }

        return {
            filter: paramsSelectors.filter,
            filterAsync: (selector: EntityParamsSelector<TEntity, T>) => {
                return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
                    paramsSelectors.filter(selector, resolve, reject);
                })
            },
            first: () => {

            },
            find: paramsSelectors.find,
            findAsync: (selector: EntityParamsSelector<TEntity, T>) => {
                return new Promise<NonNullEntity<TEntity> | null>((resolve, reject) => {
                    paramsSelectors.find(selector, resolve, reject);
                })
            },
            pluck: paramsSelectors.pluck,
            pluckAsync: <TKey extends keyof NonNullEntity<TEntity>>(selector: EntityParamsSelector<TEntity, T>, propertyName: TKey) => {
                return new Promise<NonNullEntity<TEntity>[TKey] | null>((resolve, reject) => {
                    paramsSelectors.pluck(selector, propertyName, resolve, reject);
                })
            }
        }
    }

    filter(selector: EntitySelector<TEntity>, resolve: EntityResolveMany<TEntity>, reject: ErrorCallback) {
        this._dbPlugin.all<NonNullEntity<TEntity>>(
            this.schema.tableName,
            (e) => this._resolveMany(resolve, e, selector),
            (e) => this._reject(reject, e)
        );
    }

    filterAsync(selector: EntitySelector<TEntity>) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.filter(selector, resolve, reject);
        });
    }

    get(ids: IdType[], resolve: EntityResolveMany<TEntity>, reject: ErrorCallback) {
        this._dbPlugin.get<NonNullEntity<TEntity>>(
            this.schema.tableName,
            ids,
            (e) => this._resolveMany(resolve, e),
            (e) => this._reject(reject, e)
        );
    }

    getAsync(...ids: IdType[]) {
        return new Promise<NonNullEntity<TEntity>[]>((resolve, reject) => {
            this.get(ids, resolve, reject);
        });
    }

    pluck<TKey extends keyof NonNullEntity<TEntity>>(selector: EntitySelector<TEntity>, propertyName: TKey, resolve: (value: NonNullEntity<TEntity>[TKey] | null) => void, reject: ErrorCallback) {
        this._dbPlugin.all<NonNullEntity<TEntity>>(
            this.schema.tableName,
            (e) => this._resolveOne(e => resolve(e == null ? null : e[propertyName]), e, selector),
            (e) => this._reject(reject, e)
        );
    }

    pluckAsync<TKey extends keyof NonNullEntity<TEntity>>(selector: EntitySelector<TEntity>, propertyName: TKey, resolve: (value: NonNullEntity<TEntity>[TKey] | null) => void, reject: ErrorCallback) {
        return new Promise<NonNullEntity<TEntity>[TKey] | null>((resolve, reject) => {
            this.pluck(selector, propertyName, resolve, reject);
        });
    }

    private _resolveMany(done: (entities: NonNullEntity<TEntity>[]) => void, entities: NonNullEntity<TEntity>[], selector?: EntitySelector<TEntity>) {
        // run post select operations

        if (selector != null) {
            done(entities.filter(selector))
            return
        }

        done(entities);
    }

    private _resolveOne(done: (entity: NonNullEntity<TEntity> | null) => void, entities: NonNullEntity<TEntity>[], selector?: EntitySelector<TEntity>) {
        // run enrichers

        // on save we want to run our striping functions to ensure functions are not saved into the database

        if (entities.length === 0) {
            done(null);
            return;
        }

        done(entities[0]);
    }

    private _reject(done: (error?: any) => void, error?: any) {
        // run post select rejections
    }
}