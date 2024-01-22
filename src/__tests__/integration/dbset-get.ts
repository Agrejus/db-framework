import { shouldFilterEntitiesWithDefaults, shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery } from "./shared/common-tests";
import { DbContextFactory, ExternalDataContext } from "./shared/context";

describe('DbSet Get Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should get correct number of entities from get', async () => {

        const context = contextFactory.createContext(ExternalDataContext);
        const [one, two] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "Other",
            lastName: "DeMeuse",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const all = await context.contacts.get(one._id, two._id);

        expect(all.length).toBe(2);
    });

    it('should throw when id is not found on get', async () => {

        const context = contextFactory.createContext(ExternalDataContext);
        const [one, two] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "Other",
            lastName: "DeMeuse",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        try {
            await context.contacts.get("tester");
            expect(false).toBe(true)
        } catch (e) {
            expect(e).toBeDefined()
        }
    });

    it('should get entities with no defaults', async () => {

        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaults(
            () => contextFactory.createContextWithParams("", dbName),
            (dbSet, _, added) => dbSet.get(added._id),
            w => expect(w.length).toBe(1))
    });

    it('should get entities with defaults', async () => {
        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaults(
            () => contextFactory.createContextWithParams("CouchDB", dbName),
            (dbSet, _, added) => dbSet.get(added._id),
            w => expect(w.length).toBe(1))
    });

    it('should get entities and not find result when base filter does not match - with default', async () => {
        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery(
            () => contextFactory.createContextWithParams("CouchDB", dbName),
            () => contextFactory.createContextWithParams("", dbName),
            (dbSet, _, added) => dbSet.get(added._id),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(0),
            w => expect(w.length).toBe(1))
    });

    it('should get entities and not find result when base filter does not match - with no default', async () => {
        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery(
            () => contextFactory.createContextWithParams("", dbName),
            () => contextFactory.createContextWithParams("CouchDB", dbName),
            (dbSet, _, added) => dbSet.get(added._id),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(0),
            w => expect(w.length).toBe(1))
    });
});