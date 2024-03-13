## 1.0.0
- Full Release

## 1.0.1
- Fixed issue with ReadOnlyList returning undefined for items when using `match()`

## 1.1.0
- Enhancers can now modify an entity and changes will be tracked
- Added transactions to bulkOperations for DB Plugins.  Now devs can see what properties have changed
- Core updates to enrichment processors
- Added ability to cache requests using `useCache()`
- Added `.dbsets` to `DataContext` for easy access to all DbSets
- Refactored core fetching mechanism
- Added `.clearCache()` to `DataContext` for easy clearing of cache
- Fixed speed issue when saving a large number of entities (>1000)
