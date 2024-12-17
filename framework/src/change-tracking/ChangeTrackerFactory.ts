import { CompiledSchema, IDbPlugin } from "@agrejus/db-framework-core";
import { IChangeTracker } from "./types";
import { SingleNonIdentityKeyChangeTracker } from './SingleNonIdentityKeyChangeTracker';
import { MultiNonIdentityKeyChangeTracker } from './MultiNonIdentityKeyChangeTracker';
import { IdentityKeyChangeTracker } from './IdentityKeyChangeTracker';

export class ChangeTrackerFactory {

    static create<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never>(schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin): IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

        if (schema.hasIdentityKeys === false) {

            if (schema.idPropertyNames.length === 1) {
                // will work with and without identies because we return the full object back and merge it
                return new SingleNonIdentityKeyChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(schema, dbPlugin);
            }

            return new MultiNonIdentityKeyChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(schema, dbPlugin);
        }

        return new IdentityKeyChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames>(schema, dbPlugin);
    }
}