import { CompiledSchema, IDbPlugin } from "@agrejus/db-framework-core";
import { IChangeTracker } from "./types";
import { IdentityKeyChangeTrackingBase } from './base/IdentityKeyChangeTrackingBase';
import { NonIdentityKeyChangeTrackingBase } from './base/NonIdentityKeyChangeTrackingBase';
import { ChangeTrackingType } from "@agrejus/db-framework-core/dist/schema";
import { TrampolinePipeline } from "../DataContextPipeline";
import { SaveChangesContextStepOne } from "../types";

export class ChangeTrackerFactory {

    static create<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never>(
        schema: CompiledSchema<TEntity>, 
        dbPlugin: IDbPlugin, 
        changeTrackingType: ChangeTrackingType,
        pipeline: TrampolinePipeline<SaveChangesContextStepOne>,
        abortController: AbortController
    ): IChangeTracker<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

        if (schema.hasIdentityKeys === true) {
            return new IdentityKeyChangeTrackingBase(schema, dbPlugin, changeTrackingType, pipeline, abortController)
        }

        return new NonIdentityKeyChangeTrackingBase(schema, dbPlugin, changeTrackingType, pipeline, abortController);
    }
}