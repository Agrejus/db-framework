import { CompiledSchema, IDbPlugin } from "@agrejus/db-framework-core";
import { IChangeTracker } from "./types";
import { IdentityKeyChangeTrackingBase } from './base/IdentityKeyChangeTrackingBase';
import { NonIdentityKeyChangeTrackingBase } from './base/NonIdentityKeyChangeTrackingBase';
import { ChangeTrackingType } from "@agrejus/db-framework-core/dist/schema";

export class ChangeTrackerFactory {

    static create<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never>(schema: CompiledSchema<TEntity>, dbPlugin: IDbPlugin, changeTrackingType: ChangeTrackingType): IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

        if (schema.hasIdentityKeys === true) {
            return new IdentityKeyChangeTrackingBase(schema, dbPlugin, changeTrackingType)
        }

        return new NonIdentityKeyChangeTrackingBase(schema, dbPlugin, changeTrackingType);
    }
}