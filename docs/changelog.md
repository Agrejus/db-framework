## 1.1.0
- Enhancers can now modify an entity and changes will be tracked
- Added transactions to bulkOperations for DB Plugins.  Now devs can see what properties have changed
- Core updates to enrichment processors
- Added ability to cache requests using `useCache()`.  Caching can have a TTL (time to live) or no TTL and rely on automatic cache clearing when a dbset has changes.
- Added `.dbsets` to `DataContext` for easy access to all DbSets
- Refactored core fetching mechanism
- Added `.clearCache()` to `DataContext` for easy clearing of cache
- Fixed speed issue when saving a large number of entities (>1000)
- Added `subscribe()` to `DbSet` for easy subscriptions to changes
- Changed `saveChanges()` to return a `SaveResult` instead of a `Promise<number>`
- Changed `onAfterSaveChanges` to a non blocking call to allow for better performance

## 1.0.1
- Fixed issue with ReadOnlyList returning undefined for items when using `match()`

## 1.0.0
- Full Release