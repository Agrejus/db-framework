# Database Plugins

DB Framework operates off a two layer concept consisting of an ORM interaction layer (database plugin) and an entity interaction layer (DB Framework).  All entity changes and queries are send through an database plugin that is responsible for all CRUD operations.

# Plugins Available
- [PouchDB](database-plugins/pouchdb)
- [Memory](database-plugins/memory)
- [Local Storage](database-plugins/localstorage)
- [IDB](database-plugins/idb)
- [Free Sync](database-plugins/free-sync)
- [CapacitorJS Sqlite3](database-plugins/capacitorjs-sqlite3)
- [CapacitorJS Realm](database-plugins/capacitorjs-realm)