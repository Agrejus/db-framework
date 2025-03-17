import { CompiledSchema, IDbPlugin } from '@agrejus/db-framework-core';
import { DbSet } from '../db-sets/DbSet';
import { ImmutableDbSet } from '../db-sets/ImmutableDbSet';
import { DbSetOptions } from '../types';
import { DbSetInstanceCreator } from './types';

type DbSetBuilderProps<TEntity extends {}, TEnhancedPropertyNames extends string, TComputedPropertyNames extends string, TDbSet extends DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>> = {
    onDbSetCreated: (dbset: DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>) => void;
    schema: CompiledSchema<TEntity>;
    dbPlugin: IDbPlugin;
    isStateful: boolean;
    instanceCreator: DbSetInstanceCreator<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet>;
}

export class DbSetBuilder<TEntity extends {}, TEnhancedPropertyNames extends string, TComputedPropertyNames extends string, TDbSet extends DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>> {

    private _onDbSetCreated: (dbset: DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>) => void;
    private readonly _schema: CompiledSchema<TEntity>;
    private readonly _dbPlugin: IDbPlugin;
    private _isStateful: boolean = false;
    private _instanceCreator: DbSetInstanceCreator<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet> = DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> as any;

    constructor(props: DbSetBuilderProps<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet>) {
        this._schema = props.schema;
        this._dbPlugin = props.dbPlugin;
        this._onDbSetCreated = props.onDbSetCreated;
        this._isStateful = props.isStateful;
    }

    protected createProps(): DbSetBuilderProps<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet> {
        return {
            dbPlugin: this._dbPlugin,
            onDbSetCreated: this._onDbSetCreated,
            schema: this._schema,
            isStateful: this._isStateful,
            instanceCreator: this._instanceCreator
        }
    }

    stateful() {
        this._isStateful = true;
        return new DbSetBuilder<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet>(this.createProps());
    }

    immutable() {
        return new DbSetBuilder<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, ImmutableDbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>>({
            dbPlugin: this._dbPlugin,
            isStateful: this._isStateful,
            onDbSetCreated: this._onDbSetCreated,
            schema: this._schema,
            instanceCreator: ImmutableDbSet
        });
    }

    create(): TDbSet;
    create<TExtension extends TDbSet>(extend: (i: DbSetInstanceCreator<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet>, dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions) => TExtension): TExtension;
    create<TExtension extends TDbSet = never>(extend?: (i: DbSetInstanceCreator<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet>, dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions) => TExtension) {

        if (extend == null) {
            const Instance = this._instanceCreator;
            const result = new Instance(this._dbPlugin, this._schema, {
                stateful: this._isStateful
            });

            this._onDbSetCreated(result);

            return result;
        }

        const Instance = this._instanceCreator;
        const extendedResult = extend(Instance, this._dbPlugin, this._schema, {
            stateful: this._isStateful
        });

        this._onDbSetCreated(extendedResult);

        return extendedResult;
    }
}