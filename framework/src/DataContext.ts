import { CompiledSchema, IDbPlugin } from '@agrejus/db-framework-core';
import { DbSet } from './db-sets/DbSet';
import { forEach } from './utilities';
import { DbSetBuilder } from './dbset-builder/DbSetBuilder';

export class DataContext {

    private readonly _dbPlugin: IDbPlugin;
    private readonly _dbsets: Map<number, DbSet<any>>;

    constructor(dbPlugin: IDbPlugin) {
        this._dbPlugin = dbPlugin;
        this._dbsets = new Map<number, DbSet<any>>();
    }

    protected dbset<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never>(schema: CompiledSchema<TEntity>) {

        const onDbSetCreated = (dbset: DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>) => this._dbsets.set(schema.key, dbset);

        return new DbSetBuilder<TEntity, TEnhancedPropertyNames, TComputedPropertyNames, DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>>({
            dbPlugin: this._dbPlugin,
            instanceCreator: DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>,
            isStateful: false,
            onDbSetCreated: onDbSetCreated.bind(this),
            schema
        });
    }

    // Can we borrow from redux and create a way to inject middleware?
    // use actions?
    // action.type -> "SaveChanges"
    saveChanges(done: (result: number, error?: any) => void) {

        // Swap this over to Pipe & Filter, this way we can have any middleware vs being stuck
        /* 
        * action: { type: "check-for-changes", payload: {} } => void
        * context: { 
        *   hasChanges: boolean
        *   additions: T[] -> will eventually get prepared and overwritten
        *   removals: T[]
        *   updates: T[]
        *   findAddition: fn,
        *   
        * }
        * 
        * 
        * 
        * 
        * ORDER
        * action: { type: "check-for-changes", payload -> context } => void
        * action: { type: "prepare-additions", payload -> context } => void
        * action: { type: "prepare-updates", payload -> context } => void
        * action: { type: "prepare-removals", payload -> context } => void
        * action: { type: "persist", payload -> context } => void
        * action: { type: "post-op-adds", payload -> context } => void
        * action: { type: "post-op-updates", payload -> context } => void
        * action: { type: "notify-subscribers", payload -> context } => void
        * action: { type: "clean-up", payload -> context } => void
        */

        let success_count = 0;
        const errors: any[] = [];
        const dbSets = [...this._dbsets.values()];

        forEach(dbSets, (dbset, next) => {
            dbset.changeTracker.saveChanges((r, e) => {

                success_count += r;

                if (e != null) {
                    errors.push(e);
                }

                next();
            });
        }, () => {
            done(success_count, errors.length == 0 ? null : errors);
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