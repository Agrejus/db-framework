Can we put TTL on some of the records?  We can check every N times for TTLs and purge them

// Cannot do immutable, we have no way to assign identity properties after save
const item = await context.nested.first(w => w.id === 1);


Are these needed?
    onBeforeSave
    onAfterSave

DataContext
    all() - not needed, documents are too dissimilar

DbSet
    subscribe to changes (Live Query)
    Can we do caching? Stringify the function and use as cache key
    How can we store data in memory and get data from there instead of the db
        We could have wicked fast queries with caching
        Can we set a cache total and store in memory?  Only cache 10k records?
            Or we can do the top queries and cache those?

Provide Custom DbSet to restore legacy functionality
    pluck
        where(w => w).map(w => ({ test:w.test })).firstOrUndefined();

    filter
        where(w => w).toArray()

Can we do CDC so we can create history tables?
    Can we apply a TTL to documents?

Can we provide optimistic updates to provide faster subscription calls?


# TODO
- Stateful queries should always return an array of data, how can we make that work?
-- Can we make the Stateful stuff work with replication?  Can we defined a read db?  Then we can optionally defined a readdb and a source db
-- This would be great for stateful sets, functionality would almost be built in


# Queries

Permutations

.where().toArrayAsync();
.where().where().toArrayAsync();

.where().firstOrDefaultAsync();
.where().where().firstOrDefaultAsync();

.where().firstOrUndefinedAsync();
.where().where().firstOrUndefinedAsync();

Operation Functions

AGGREGATORS (only allowed after a .map)
  min
  max
  sum
  count
  distinct

QUERY MODIFIERS
  skip
  take

SORTERS
  sort
  sortDescending

TRANSFORMERS
  map

Queryable
where (+ params)

subscribe

SELECTORS
  toArray
  first
  firstOrUndefined
  some
  every


  TODO:
    Make sure errors are reported correctly
      setting a rev in a new (add) for pouchdb, does that work?