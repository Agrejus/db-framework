import { CompiledSchema, IDbPlugin, TrampolinePipeline } from '@agrejus/db-framework-core';
import { DbSet } from './db-sets/DbSet';
import { DbSetBuilder } from './dbset-builder/DbSetBuilder';
import { DbSetPipelines, SaveChangesContextStepOne } from './types';

export class DataContext implements Disposable {

    private readonly _dbPlugin: IDbPlugin;
    private readonly _dbsets: Map<number, DbSet<any>>;
    private readonly _dbSetPipelines: DbSetPipelines;
    private readonly _abortController: AbortController;

    constructor(dbPlugin: IDbPlugin) {
        this._abortController = new AbortController();
        this._dbPlugin = dbPlugin;
        this._dbsets = new Map<number, DbSet<any>>();
        this._dbSetPipelines = {
            save: new TrampolinePipeline<SaveChangesContextStepOne>(),
            hasChanges: new TrampolinePipeline<{ hasChanges: boolean }>()
        };
    }

    protected dbset<TEntity extends {}>(schema: CompiledSchema<TEntity>) {

        const onDbSetCreated = (dbset: DbSet<TEntity>) => {
            this._dbsets.set(schema.key, dbset)
        };

        return new DbSetBuilder<TEntity, DbSet<TEntity>>({
            dbPlugin: this._dbPlugin,
            instanceCreator: DbSet<TEntity>,
            isStateful: false,
            onDbSetCreated: onDbSetCreated.bind(this),
            schema,
            pipelines: this._dbSetPipelines,
            signal: this._abortController.signal,
            parent: {
                allSchemas: this.getAllSchemas.bind(this)
            }
        });
    }

    addEventListener(event: "", cb: () => void) {

    }

    private getAllSchemas(): CompiledSchema<any>[] {
        const result: CompiledSchema<any>[] = [];

        for (const [, value] of this._dbsets) {
            result.push(value.schema);
        }

        return result;
    }

    // Can we borrow from redux and create a way to inject middleware?
    // use actions?
    // action.type -> "SaveChanges"
    saveChanges(done: (result: number, error?: any) => void) {

        const response = {
            count: 0,
            allSchemas: this.getAllSchemas.bind(this)
        };

        this._dbSetPipelines.save.filter<SaveChangesContextStepOne>(response, (result, error) => {
            done(result.count, error);
        });
    }

    saveChangesAsync() {
        return new Promise<number>((resolve, reject) => {
            this.saveChanges((r, e) => {
                if (e != null) {
                    reject(e);
                    return;
                }

                resolve(r);
            })
        });
    }

    previewChanges() {

    }

    hasChanges(done: (result: boolean, error?: any) => void) {
        const payload = {
            hasChanges: false
        }

        this._dbSetPipelines.hasChanges.filter<{ hasChanges: false }>(payload, (r, e) => {
            done(r.hasChanges, e);
        })
    }

    hasChangesAsync() {
        return new Promise<boolean>((resolve, reject) => {
            this.hasChanges((r, e) => {
                if (e != null) {
                    reject(e);
                    return;
                }

                resolve(r);
            })
        });
    }

    destroy(done: (error?: any) => void) {
        this._dbPlugin.destroy(done);
    }

    destroyAsync() {
        return new Promise<void>((resolve, reject) => {
            this.destroy((e) => {
                if (e != null) {
                    reject(e);
                    return;
                }

                resolve();
            })
        });
    }

    [Symbol.dispose]() {
        this._abortController.abort();
    }
}


/**
 * Events
 *  Need a way to update stateful sets
 */