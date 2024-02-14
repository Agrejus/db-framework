import { shouldFilterEntitiesWithDefaults, shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery } from "./shared/common-tests";
import { DbContextFactory, ExternalDataContext } from "./shared/context";

describe('DbSet All Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should get correct number of entities from all', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.cars.add({
            make: "test",
            manufactureDate: new Date(),
            model: "test",
            year: 2000
        });

        await context.saveChanges();

        const all = await context.contacts.all();

        expect(all.length).toBe(1);
    });

    it('should get all entities with no defaults', async () => {

        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaults(
            () => contextFactory.createContextWithParams("", dbName),
            (dbSet, _) => dbSet.all(),
            w => expect(w.length).toBe(1))
    });

    it('should get all entities with defaults', async () => {
        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaults(
            () => contextFactory.createContextWithParams("CouchDB", dbName),
            (dbSet, _) => dbSet.all(),
            w => expect(w.length).toBe(1))
    });

    it('should get all entities and not find result when base filter does not match - with default', async () => {
        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery(
            () => contextFactory.createContextWithParams("CouchDB", dbName),
            () => contextFactory.createContextWithParams("", dbName),
            (dbSet, _) => dbSet.all(),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(0),
            w => expect(w.length).toBe(1))
    });

    it('should get all entities and not find result when base filter does not match - with no default', async () => {
        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery(
            () => contextFactory.createContextWithParams("", dbName),
            () => contextFactory.createContextWithParams("CouchDB", dbName),
            (dbSet, _) => dbSet.all(),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(0),
            w => expect(w.length).toBe(1))
    });
});