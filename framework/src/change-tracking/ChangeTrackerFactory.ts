import { CompiledSchema, IDbPlugin } from "@agrejus/db-framework-core";
import { IChangeTracker } from "./types";
import { IdentityKeyChangeTrackingBase } from './base/IdentityKeyChangeTrackingBase';
import { NonIdentityKeyChangeTrackingBase } from './base/NonIdentityKeyChangeTrackingBase';
import { ChangeTrackingType } from "@agrejus/db-framework-core/dist/schema";
import { Pipeline } from "../DataContextPipeline";
import { SaveChangesContext } from "../types";

export class ChangeTrackerFactory {

    static create<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never>(
        schema: CompiledSchema<TEntity>, 
        dbPlugin: IDbPlugin, 
        changeTrackingType: ChangeTrackingType,
        pipeline: Pipeline<SaveChangesContext<TEntity>, SaveChangesContext<TEntity>>
    ): IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

        if (schema.hasIdentityKeys === true) {
            return new IdentityKeyChangeTrackingBase(schema, dbPlugin, changeTrackingType, pipeline)
        }

        return new NonIdentityKeyChangeTrackingBase(schema, dbPlugin, changeTrackingType, pipeline);
    }
}