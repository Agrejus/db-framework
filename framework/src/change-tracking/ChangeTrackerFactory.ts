import { CompiledSchema, IDbPlugin } from "@agrejus/db-framework-core";
import { IChangeTracker } from "./types";
import { SingleNonIdentityKeyChangeTracker } from './legacy/SingleNonIdentityKeyChangeTracker';
import { MultiNonIdentityKeyChangeTracker } from './legacy/MultiNonIdentityKeyChangeTracker';
import { MultiKeyIdentityChangeTracker } from './legacy/MultiKeyIdentityChangeTracker';
import { SingleIdentityKeyChangeTracker } from './legacy/SingleKeyIdentityChangeTracker';
import { IdentityKeyChangeTrackingBase } from './base/IdentityKeyChangeTrackingBase';
import { NonIdentityKeyChangeTrackingBase } from './base/NonIdentityKeyChangeTrackingBase';

export class ChangeTrackerFactory {

    static create<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never>(schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin): IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

        if (schema.hasIdentityKeys === true) {
            return new IdentityKeyChangeTrackingBase(schema, dbPlugin)
        }

        return new NonIdentityKeyChangeTrackingBase(schema, dbPlugin);

        // if (schema.hasIdentityKeys === false) {

        //     if (schema.idPropertyNames.length === 1) {
        //         // will work with and without identies because we return the full object back and merge it
        //         return new SingleNonIdentityKeyChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(schema, dbPlugin);
        //     }

        //     return new MultiNonIdentityKeyChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(schema, dbPlugin);
        // }

        // if (schema.idPropertyNames.length === 1) {
        //     return new SingleIdentityKeyChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(schema, dbPlugin);
        // }

        // return new MultiKeyIdentityChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(schema, dbPlugin);
    }
}