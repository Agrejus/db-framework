import { NonNullEntity } from "@agrejus/db-framework-core";
import { DbSet } from "./DbSet";
import { ChangeTrackingType } from "@agrejus/db-framework-core/dist/schema";

export class ImmutableDbSet<TEntity extends {}, TEnhancedPropertyNames extends string = never, TComputedPropertyNames extends string = never> extends DbSet<TEntity, TEnhancedPropertyNames, TComputedPropertyNames> {

    protected override getChangeTrackingType(): ChangeTrackingType {
        return "immutable";
    }

    // We know changes are made if the attached entity is a proxy, means we altered it
    // Immutable sets deal with frozen objects
    mutate(entity: NonNullEntity<TEntity>, mutator: (draft: NonNullEntity<TEntity>) => void): NonNullEntity<TEntity> {

        const clone = this.schema.clone(entity);

        // enable change tracking
        const changeTrackedEntity = this.schema.enableChangeTracking(clone);

        mutator(changeTrackedEntity);

        // replace the entity with the change tracked entity
        this.changeTracker.replace(entity, changeTrackedEntity);

        // clone the change tracked entity to remove change tracking
        const untracked =  this.schema.clone(changeTrackedEntity);

        return this.schema.freeze(untracked);
    }

}