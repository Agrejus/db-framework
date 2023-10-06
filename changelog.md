## 0.0.1-beta.3
- Fix build

## 0.0.1-beta.2
- Removed dependencies on _rev and _id, can now declare this properites dynamically via a plugin

## 0.0.1-beta.1
- Fixes for context change tracking

## 0.0.1-beta.0
- Initial release, porting over from pouchdb-entity-fabric
- Added Store DbSet to allow for Redux-like experience for local data and tracking changes
- Pulled out hard dependency on PouchDB in favor of plugin architecture to support more Databases
- Introduced context change tracking