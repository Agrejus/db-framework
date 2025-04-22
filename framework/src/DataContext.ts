import { CompiledSchema, IDbPlugin } from '@agrejus/db-framework-core';
import { DbSet } from './db-sets/DbSet';
import { DbSetBuilder } from './dbset-builder/DbSetBuilder';
import { TrampolinePipeline } from './TrampolinePipeline';
import { SaveChangesContextStepOne } from './types';

export class DataContext implements Disposable {

    private readonly _dbPlugin: IDbPlugin;
    private readonly _dbsets: Map<number, DbSet<any>>;
    private readonly _saveChangesPipeline: TrampolinePipeline<SaveChangesContextStepOne>;
    private readonly _abortController: AbortController;

    constructor(dbPlugin: IDbPlugin) {
        this._dbPlugin = dbPlugin;
        this._dbsets = new Map<number, DbSet<any>>();
        this._saveChangesPipeline = new TrampolinePipeline<SaveChangesContextStepOne>();
        this._abortController = new AbortController();
    }

    protected dbset<TEntity extends {}>(schema: CompiledSchema<TEntity>) {

        const onDbSetCreated = (dbset: DbSet<TEntity>) => {
            this._dbsets.set(schema.key, dbset as any)
        };

        return new DbSetBuilder<TEntity, DbSet<TEntity>>({
            dbPlugin: this._dbPlugin,
            instanceCreator: DbSet<TEntity>,
            isStateful: false,
            onDbSetCreated: onDbSetCreated.bind(this),
            schema,
            pipeline: this._saveChangesPipeline,
            abortController: this._abortController
        });
    }

    addEventListener(event: "", cb: () => void) {

    }

    // Can we borrow from redux and create a way to inject middleware?
    // use actions?
    // action.type -> "SaveChanges"
    saveChanges(done: (result: number, error?: any) => void) {

        const response = { count: 0 };
        
        this._saveChangesPipeline.filter<SaveChangesContextStepOne>(response, (result, error) => done(result.count, error));
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

    hasChanges() {
        // for (const [, dbset] of this._dbsets) {
        //     if (dbset.changeTracker.hasChanges() === true) {
        //         return true;
        //     }
        // }

        // return false;
    }

    destroy(done: (error?: any) => void) {
        this._dbPlugin.destroy(done);
    }

    [Symbol.dispose]() {
        this._abortController.abort();
    }
}


/**
 * Events
 *  Need a way to update stateful sets
 */