import { NonNullEntity } from "@agrejus/db-framework-core";
import { DbSet } from "./DbSet";
import { ChangeTrackingType } from "@agrejus/db-framework-core/dist/schema";

export class ImmutableDbSet<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> extends DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

    protected override getChangeTrackingType(): ChangeTrackingType {
        return "immutable";
    }

    mutate(entity: NonNullEntity<TEntity>, mutator: (draft: NonNullEntity<TEntity>) => NonNullEntity<TEntity>) {

        const clone = this.schema.clone(entity);

        this.changeTracker.replace(entity, clone);

        return mutator(clone);
    }

}