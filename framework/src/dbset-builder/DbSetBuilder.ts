import { CompiledSchema, IDbPlugin } from '@agrejus/db-framework-core';
import { DbSet } from '../db-sets/DbSet';
import { DbSetOptions, DbSetPipelines } from '../types';
import { DbSetInstanceCreator } from './types';
import { StatefulDbSet } from '../db-sets/StatefulDbSet';

type DbSetBuilderProps<TEntity extends {}, TDbSet extends DbSet<TEntity>> = {
    onDbSetCreated: (dbset: DbSet<TEntity>) => void;
    schema: CompiledSchema<TEntity>;
    dbPlugin: IDbPlugin;
    isStateful: boolean;
    instanceCreator: DbSetInstanceCreator<TEntity, TDbSet>;
    pipelines: DbSetPipelines;
    signal: AbortSignal;
}

export class DbSetBuilder<TEntity extends {}, TDbSet extends DbSet<TEntity>> {

    private _onDbSetCreated: (dbset: DbSet<TEntity>) => void;
    private readonly _schema: CompiledSchema<TEntity>;
    private readonly _dbPlugin: IDbPlugin;
    private _isStateful: boolean = false;
    private _instanceCreator: DbSetInstanceCreator<TEntity, TDbSet>;
    private _pipelines: DbSetPipelines;
    private _signal: AbortSignal;

    constructor(props: DbSetBuilderProps<TEntity, TDbSet>) {
        this._pipelines = props.pipelines;
        this._schema = props.schema;
        this._dbPlugin = props.dbPlugin;
        this._onDbSetCreated = props.onDbSetCreated;
        this._isStateful = props.isStateful;
        this._instanceCreator = props.instanceCreator;
        this._signal = props.signal;
    }

    stateful() {
        this._isStateful = true;
        return new DbSetBuilder<TEntity, StatefulDbSet<TEntity>>({
            dbPlugin: this._dbPlugin,
            isStateful: true,
            onDbSetCreated: this._onDbSetCreated,
            schema: this._schema,
            instanceCreator: StatefulDbSet,
            pipelines: this._pipelines,
            signal: this._signal
        });
    }

    create(): TDbSet;
    create<TExtension extends TDbSet>(extend: (i: DbSetInstanceCreator<TEntity, TDbSet>, dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions, pipelines: DbSetPipelines) => TExtension): TExtension;
    create<TExtension extends TDbSet = never>(extend?: (i: DbSetInstanceCreator<TEntity, TDbSet>, dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions, pipelines: DbSetPipelines) => TExtension) {
        if (extend == null) {
            const Instance = this._instanceCreator;
            const result = new Instance(this._dbPlugin, this._schema, {
                stateful: this._isStateful,
                signal: this._signal
            }, this._pipelines);

            this._onDbSetCreated(result);

            return result;
        }

        const Instance = this._instanceCreator;
        const extendedResult = extend(Instance, this._dbPlugin, this._schema, {
            stateful: this._isStateful,
            signal: this._signal
        }, this._pipelines);

        this._onDbSetCreated(extendedResult);

        return extendedResult;
    }
}