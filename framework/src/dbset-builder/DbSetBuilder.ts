import { CompiledSchema, IDbPlugin, SchemaParent } from '@agrejus/db-framework-core';
import { DbSet } from '../db-sets/DbSet';
import { DbSetOptions, DbSetPipelines, StatefulDbSetOptions } from '../types';
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
    stateful?: { optimistic: boolean }
    parent: SchemaParent;
}

export class DbSetBuilder<TEntity extends {}, TDbSet extends DbSet<TEntity>> {

    private _onDbSetCreated: (dbset: DbSet<TEntity>) => void;
    private readonly _schema: CompiledSchema<TEntity>;
    private readonly _dbPlugin: IDbPlugin;
    private _isStateful: boolean = false;
    private _instanceCreator: DbSetInstanceCreator<TEntity, TDbSet>;
    private _pipelines: DbSetPipelines;
    private _signal: AbortSignal;
    private _statefulProps?: { optimistic: boolean }
    private parent: SchemaParent;

    constructor(props: DbSetBuilderProps<TEntity, TDbSet>) {
        this._pipelines = props.pipelines;
        this._schema = props.schema;
        this._dbPlugin = props.dbPlugin;
        this._onDbSetCreated = props.onDbSetCreated;
        this._isStateful = props.isStateful;
        this._instanceCreator = props.instanceCreator;
        this._signal = props.signal;
        this._statefulProps = props.stateful;
        this.parent = props.parent;
    }

    /**
     * Optimistic will write data to the read plugin first making it available immediately, then
     * it will write that response to the source database asyncronously.  We optimistically
     * assume the write to the source database will succeed
     */
    stateful(options?: { optimistic?: boolean }) {
        this._isStateful = true;
        return new DbSetBuilder<TEntity, StatefulDbSet<TEntity>>({
            dbPlugin: this._dbPlugin,
            isStateful: true,
            onDbSetCreated: this._onDbSetCreated,
            schema: this._schema,
            instanceCreator: StatefulDbSet,
            pipelines: this._pipelines,
            signal: this._signal,
            stateful: {
                optimistic: options?.optimistic ?? false
            },
            parent: this.parent
        });
    }

    create(): TDbSet;
    create<TExtension extends TDbSet>(extend: (i: DbSetInstanceCreator<TEntity, TDbSet>, dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions, pipelines: DbSetPipelines, parent: SchemaParent) => TExtension): TExtension;
    create<TExtension extends TDbSet = never>(extend?: (i: DbSetInstanceCreator<TEntity, TDbSet>, dbPlugin: IDbPlugin, schema: CompiledSchema<TEntity>, options: DbSetOptions, pipelines: DbSetPipelines, parent: SchemaParent) => TExtension) {

        const options: DbSetOptions = {
            stateful: this._isStateful,
            signal: this._signal,
        }

        if (this._isStateful === true) {
            (options as StatefulDbSetOptions).optimistic = this._statefulProps?.optimistic ?? false
        }

        if (extend == null) {
            const Instance = this._instanceCreator;
            const result = new Instance(this._dbPlugin, this._schema, options, this._pipelines, this.parent);

            this._onDbSetCreated(result);

            return result;
        }

        const Instance = this._instanceCreator;
        const extendedResult = extend(Instance, this._dbPlugin, this._schema, options, this._pipelines, this.parent);

        this._onDbSetCreated(extendedResult);

        return extendedResult;
    }
}