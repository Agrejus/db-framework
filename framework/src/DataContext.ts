import { CompiledSchema, IDbPlugin } from '@agrejus/db-framework-core';
import { DbSet } from './db-sets/DbSet';
import { forEach } from './utilities';
import { DbSetBuilder } from './dbset-builder/DbSetBuilder';
import { Pipeline } from './DataContextPipeline';
import { SaveChangesContextStepOne } from './types';



export class DataContext {

    private readonly _dbPlugin: IDbPlugin;
    private readonly _dbsets: Map<number, DbSet<any>>;
    private readonly _saveChangesPipeline: Pipeline<SaveChangesContextStepOne> = Pipeline.create();

    constructor(dbPlugin: IDbPlugin) {
        this._dbPlugin = dbPlugin;
        this._dbsets = new Map<number, DbSet<any>>();
    }

    protected dbset<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never>(schema: CompiledSchema<TEntity>) {

        const onDbSetCreated = (dbset: DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>) => {
            this._dbsets.set(schema.key, dbset)
        };

        return new DbSetBuilder<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>>({
            dbPlugin: this._dbPlugin,
            instanceCreator: DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>,
            isStateful: false,
            onDbSetCreated: onDbSetCreated.bind(this),
            schema,
            pipeline: this._saveChangesPipeline as Pipeline<SaveChangesContextStepOne>
        });
    }

    // Can we borrow from redux and create a way to inject middleware?
    // use actions?
    // action.type -> "SaveChanges"
    saveChanges(done: (result: number, error?: any) => void) {

        let success_count = 0;
        const errors: any[] = [];
        const dbSets = [...this._dbsets.values()];
        
        this._saveChangesPipeline.execute({ count: 0 }, (result, error) => {

        })

        // forEach(dbSets, (dbset, next) => {
        //     dbset.changeTracker.saveChanges((r, e) => {

        //         success_count += r;

        //         if (e != null) {
        //             errors.push(e);
        //         }

        //         next();
        //     });
        // }, () => {
        //     done(success_count, errors.length == 0 ? null : errors);
        // });
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
        for (const [, dbset] of this._dbsets) {
            if (dbset.changeTracker.hasChanges() === true) {
                return true;
            }
        }

        return false;
    }

    destroy(done: (error?: any) => void) {
        this._dbPlugin.destroy(done);
    }
}