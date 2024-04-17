# Change Tracking

Change tracking provides DB Framework with a way of knowing what changed, so when `.saveChanges()` is called, we only save entities that have changes.  This prevents over saving entities, which can lead to less than desired results.

## Types of Change Tracking
- [Entity Change Tracking](data-modification/change-tracking/entity-change-tracking)
- [Readonly Change Tracking](data-modification/change-tracking/readonly-change-tracking)
- [Custom Change Tracking](data-modification/change-tracking/custom-change-tracking)

## Change Tracking Differences
- Entity Change Tracking
    - Changes are tracked at the entity level.  If an entity is unlinked from one context and linked to another, changes are preserved
    - Entites are Proxy objects
- Readonly Change Tracking
    - Changes are never tracked even if they are forced by other methods
    - Entites are Proxy objects
- Custom Change Tracking
    - Changes are tracked at the context level.  If an entity is unlinked from one context and linked to another, changes are lost and the entity must be marked as dirty
    - Entites are plain JavaScript objects
    - Change tracking must be defined by the dbset using the `getChanges()` function on the dbset builder