import { CompiledSchema, IDbPlugin } from '@agrejus/db-framework-core';
import { DbSet } from '../db-sets/DbSet';
import { ImmutableDbSet } from '../db-sets/ImmutableDbSet';
import { DbSetOptions, SaveChangesContextStepOne } from '../types';
import { DbSetInstanceCreator } from './types';
import { StatefulDbSet } from '../db-sets/StatefulDbSet';
import { TrampolinePipeline } from '../DataContextPipeline';

type DbSetBuilderProps<TEntity extends {}, TEnhancedPropertyNames extends string, TComputedPropertyNames extends string, TDbSet extends DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>> = {
    onDbSetCreated: (dbset: DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>) => void;
    schema: CompiledSchema<TEntity>;
    dbPlugin: IDbPlugin;
    isStateful: boolean;
    instanceCreator: DbSetInstanceCreator<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet>;
    pipeline: TrampolinePipeline<SaveChangesContextStepOne>;
    abortController: AbortController;
}

export class DbSetBuilder<TEntity extends {}, TEnhancedPropertyNames extends string, TComputedPropertyNames extends string, TDbSet extends DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>> {

    private _onDbSetCreated: (dbset: DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>) => void;
    private readonly _schema: CompiledSchema<TEntity>;
    private readonly _dbPlugin: IDbPlugin;
    private _isStateful: boolean = false;
    private _instanceCreator: DbSetInstanceCreator<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet>;
    private _pipeline: TrampolinePipeline<SaveChangesContextStepOne>;
    private _abortController: AbortController;

    constructor(props: DbSetBuilderProps<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet>) {
        this._pipeline = props.pipeline;
        this._schema = props.schema;
        this._dbPlugin = props.dbPlugin;
        this._onDbSetCreated = props.onDbSetCreated;
        this._isStateful = props.isStateful;
        this._instanceCreator = props.instanceCreator;
    }

    stateful() {
        this._isStateful = true;
        return new DbSetBuilder<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, StatefulDbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>>({
            dbPlugin: this._dbPlugin,
            isStateful: true,
            onDbSetCreated: this._onDbSetCreated,
            schema: this._schema,
            instanceCreator: StatefulDbSet,
            pipeline: this._pipeline,
            abortController: this._abortController
        });
    }

    immutable() {
        return new DbSetBuilder<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, ImmutableDbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>>({
            dbPlugin: this._dbPlugin,
            isStateful: this._isStateful,
            onDbSetCreated: this._onDbSetCreated,
            schema: this._schema,
            instanceCreator: ImmutableDbSet,
            pipeline: this._pipeline,
            abortController: this._abortController
        });
    }

    create(): TDbSet;
    create<TExtension extends TDbSet>(extend: (i: DbSetInstanceCreator<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet>, dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions, pipeline: TrampolinePipeline<SaveChangesContextStepOne>) => TExtension): TExtension;
    create<TExtension extends TDbSet = never>(extend?: (i: DbSetInstanceCreator<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, TDbSet>, dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions, pipeline: TrampolinePipeline<SaveChangesContextStepOne>) => TExtension) {
        if (extend == null) {
            const Instance = this._instanceCreator;
            const result = new Instance(this._dbPlugin, this._schema, {
                stateful: this._isStateful,
                abortController: this._abortController
            }, this._pipeline);

            this._onDbSetCreated(result);

            return result;
        }

        const Instance = this._instanceCreator;
        const extendedResult = extend(Instance, this._dbPlugin, this._schema, {
            stateful: this._isStateful,
            abortController: this._abortController
        }, this._pipeline);

        this._onDbSetCreated(extendedResult);

        return extendedResult;
    }
}