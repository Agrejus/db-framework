import { NonNullEntity } from "@agrejus/db-framework-core";
import { DbSet } from "./DbSet";

export class ImmutableDbSet<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> extends DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {


    mutate(entity: NonNullEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>, mutator: (draft: NonNullEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>) => NonNullEntity<TEntity, TEnhancedPropertyNames | TComputedPropertyNames>) {

        const clone = this.schema.clone(entity);

        // replace attached entity with cloned item

        return mutator(clone);
    }

}