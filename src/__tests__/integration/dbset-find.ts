import { shouldFilterEntitiesWithDefaults, shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery } from "./shared/common-tests";
import { DbContextFactory, ExternalDataContext } from "./shared/context";

describe('DbSet Find Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should find correct entity', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const filtered = await context.contacts.find(w => w.firstName === "John");

        expect(filtered).toBeDefined();

        if (filtered == null) {
            return
        }

        expect(filtered._id).toBe("Contacts/John/Doe");
    });

    it('should find no entity', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const filtered = await context.contacts.find(w => w.firstName === "Test");

        expect(filtered).not.toBeDefined();
    });

    it('should find entities with no defaults', async () => {

        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaults(
            () => contextFactory.createContextWithParams("", dbName),
            async (dbSet, selector) => { const response = await dbSet.find(w => selector(w)); if (response) { return [response] } return [] },
            w => expect(w.length).toBe(1))
    });

    it('should find entities with defaults', async () => {
        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaults(
            () => contextFactory.createContextWithParams("CouchDB", dbName),
            async (dbSet, selector) => { const response = await dbSet.find(w => selector(w)); if (response) { return [response] } return [] },
            w => expect(w.length).toBe(1))
    });

    it('should find entities and not find result when base filter does not match - with default', async () => {
        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery(
            () => contextFactory.createContextWithParams("CouchDB", dbName),
            () => contextFactory.createContextWithParams("", dbName),
            async (dbSet, selector) => { const response = await dbSet.find(w => selector(w)); if (response) { return [response] } return [] },
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(0),
            w => expect(w.length).toBe(1))
    });

    it('should find entities and not find result when base filter does not match - with no default', async () => {
        const dbName = contextFactory.getRandomDbName();
        await shouldFilterEntitiesWithDefaultsAndNotMatchOnSecondQuery(
            () => contextFactory.createContextWithParams("", dbName),
            () => contextFactory.createContextWithParams("CouchDB", dbName),
            async (dbSet, selector) => { const response = await dbSet.find(w => selector(w)); if (response) { return [response] } return [] },
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(1),
            w => expect(w.length).toBe(0),
            w => expect(w.length).toBe(1))
    });
});