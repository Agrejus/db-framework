import { CompiledSchema, IDbPlugin } from '@agrejus/db-framework-core';
import { DbSet } from '../DbSet';
import { DbSetOptions } from '../types';
import { DbSetInstanceCreator } from './types';

export class DbSetBuilder<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> {

    private _onDbSetCreated: (dbset: DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>) => void;
    private readonly _schema: CompiledSchema<TEntity>;
    private readonly _dbPlugin: IDbPlugin;
    private _isStateful: boolean = false;

    constructor(dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, onDbSetCreated: (dbset: DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>) => void) {
        this._schema = schema;
        this._dbPlugin = dbPlugin;
        this._onDbSetCreated = onDbSetCreated;
    }

    stateful() {
        this._isStateful = true;
        return this;
    }

    immutable() {
        // should return immutable builder so we can return the correct type
        this._isStateful = true;
        return this;
    }

    create(): DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>;
    create<TExtension extends DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>>(extend: (i: DbSetInstanceCreator<TEntity>, dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions) => TExtension): TExtension;
    create<TExtension extends DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> = never>(extend?: (i: DbSetInstanceCreator<TEntity>, dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions) => TExtension) {

        if (extend == null) {
            const result = new DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(this._dbPlugin, this._schema, {
                stateful: this._isStateful
            });

            this._onDbSetCreated(result);

            return result;
        }

        const extendedResult = extend(DbSet, this._dbPlugin, this._schema, {
            stateful: this._isStateful
        });

        this._onDbSetCreated(extendedResult);

        return extendedResult;
    }
}