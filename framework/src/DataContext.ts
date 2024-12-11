import { CompiledSchema, IDbPlugin, toMap } from '@agrejus/db-framework-core';
import { DbSet } from './DbSet';

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

    saveChanges(resolve: (result: number) => void, reject: (error?: any) => void) {

        let success_count = 0;
        for (const [, dbset] of this._dbsets) {

            // prepare is removing the ref, we cannot do that
            // rename prepare to presave
            // presave - run any serializers, and delete computed/functions off object, do not strip by making a new ref
            const changes = dbset.getChanges();

            const beforeSaveAdds = toMap(changes.adds, w => dbset.schema.hash(w));

            this._dbPlugin.bulkOperations<any>(dbset.schema, {
                adds: changes.adds.map(w => dbset.schema.prepare(w)),
                removes: changes.removes,
                updates: changes.updates
            }, ({ adds, removedCount, updates }) => {
                // need to merge adds with data sent in
                for(let i = 0; i < adds.length; i++) {
                    const add = adds[i];
                    const hash = dbset.schema.hash(add);
                    const found = beforeSaveAdds.get(hash);

                    dbset.schema.merge(found, add);
                }


                success_count += (adds.length + removedCount + updates.length);

                resolve(success_count);
            }, reject);
        }
    }

    saveChangesAsync() {
        return new Promise<number>((resolve, reject) => {
            this.saveChanges(resolve, reject)
        });
    }

    previewChanges() {

    }
}