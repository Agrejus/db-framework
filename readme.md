Can we put TTL on some of the records?  We can check every N times for TTLs and purge them

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

