import { CompiledSchema, IDbPlugin, toMap } from '@agrejus/db-framework-core';
import { DbSet } from './DbSet';
import { performance } from 'perf_hooks';

export class DataContext {

    private readonly _dbPlugin: IDbPlugin;
    private readonly _dbsets: Map<number, DbSet<any>>;

    constructor(dbPlugin: IDbPlugin) {
        this._dbPlugin = dbPlugin;
        this._dbsets = new Map<number, DbSet<any>>();
    }

    protected dbset<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never>(model: CompiledSchema<TEntity>) {
        const dbset = new DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(this._dbPlugin, model);

        this._dbsets.set(model.key, dbset);

        return dbset;
    }

    saveChanges(done: (result: number, error?: any) => void) {

        let success_count = 0;
        const errors: any[] = [];
        const size = this._dbsets.size;
        let completedCounter = 0;

        const s = performance.now();
        for (const [, dbset] of this._dbsets) {

            dbset.changeTracker.saveChanges((r, e) => {

                success_count += r;

                if (e != null) {
                    errors.push(e);
                }

                completedCounter++;

                if (completedCounter == size) {
                    console.log(performance.now() - s)
                    done(success_count, errors.length == 0 ? null : errors);
                }
            });
        }
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
}