import { DbContextFactory, ExternalDataContext } from "./shared/context";
import { v4 as uuidv4 } from 'uuid';
import * as cache from '../../cache/DbSetCache';

describe('DbSet Cache TTL Tests', () => {

    const contextFactory = new DbContextFactory();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should add entity and not use cache', async () => {
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());

        const mockGetDbSetCacheValue = jest.spyOn(cache, "getDbSetCacheValue");
        const mockSetDbSetCacheValue = jest.spyOn(cache, "setDbSetCacheValue");
        const mockClearDbSetCache = jest.spyOn(cache, "clearDbSetCache");

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const found = await context.contacts.find(w => w.firstName === "James");

        expect(found).toBeDefined();
        expect(mockGetDbSetCacheValue).not.toHaveBeenCalled();
        expect(mockSetDbSetCacheValue).not.toHaveBeenCalled();
        expect(mockClearDbSetCache).toHaveBeenCalled();
    });

    it('should add entity and cache', async () => {
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());

        const mockGetDbSetCacheValue = jest.spyOn(cache, "getDbSetCacheValue")
        const mockSetDbSetCacheValue = jest.spyOn(cache, "setDbSetCacheValue");
        const mockClearDbSetCache = jest.spyOn(cache, "clearDbSetCache");

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });


        await context.saveChanges();

        const found = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");

        expect(found).toBeDefined();
        expect(mockGetDbSetCacheValue).toHaveBeenCalled();
        expect(mockSetDbSetCacheValue).toHaveBeenCalled();
        expect(mockClearDbSetCache).toHaveBeenCalledTimes(1);
    });

    it('should add entity and use cache on second call', async () => {
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());

        const mockGetDbSetCacheValue = jest.spyOn(cache, "getDbSetCacheValue")
        const mockSetDbSetCacheValue = jest.spyOn(cache, "setDbSetCacheValue");
        const mockClearDbSetCache = jest.spyOn(cache, "clearDbSetCache");

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const found = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");
        const foundCached = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");

        expect(found).toBeDefined();
        expect(foundCached?.firstName).toBe("James");
        expect(foundCached?.lastName).toBe("DeMeuse");
        expect(foundCached?.phone).toBe("111-111-1111");
        expect(foundCached?.address).toBe("1234 Test St");
        expect(mockGetDbSetCacheValue).toHaveBeenCalledTimes(2);
        expect(mockSetDbSetCacheValue).toHaveBeenCalledTimes(1);
        expect(mockClearDbSetCache).toHaveBeenCalledTimes(1);
    });

    it('should add entity and save changes when cached entity is changed', async () => {
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());

        const mockGetDbSetCacheValue = jest.spyOn(cache, "getDbSetCacheValue")
        const mockSetDbSetCacheValue = jest.spyOn(cache, "setDbSetCacheValue");
        const mockClearDbSetCache = jest.spyOn(cache, "clearDbSetCache");

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const found = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");
        const foundCached = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");

        if (foundCached == null) {
            expect(1).toBe(2);
            return;
        }

        foundCached.address = "changed";

        await context.saveChanges();

        const changed = await context.contacts.find(w => w.firstName === "James");

        expect(found).toBeDefined();
        expect(foundCached?.firstName).toBe("James");
        expect(foundCached?.lastName).toBe("DeMeuse");
        expect(foundCached?.phone).toBe("111-111-1111");
        expect(changed?.address).toBe("changed");
        expect(mockGetDbSetCacheValue).toHaveBeenCalledTimes(2);
        expect(mockSetDbSetCacheValue).toHaveBeenCalledTimes(1);
        expect(mockClearDbSetCache).toHaveBeenCalledTimes(2);
    });

    it('should add entity and not return cache when ttl has expired', async () => {
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());

        const mockGetDbSetCacheValue = jest.spyOn(cache, "getDbSetCacheValue")
        const mockSetDbSetCacheValue = jest.spyOn(cache, "setDbSetCacheValue");
        const mockClearDbSetCache = jest.spyOn(cache, "clearDbSetCache");

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const found = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");
        const foundCached = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");

        if (foundCached == null) {
            expect(1).toBe(2);
            return;
        }

        foundCached.address = "changed";

        await context.saveChanges();

        const changed = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");

        expect(found).toBeDefined();
        expect(foundCached?.firstName).toBe("James");
        expect(foundCached?.lastName).toBe("DeMeuse");
        expect(foundCached?.phone).toBe("111-111-1111");
        expect(changed?.address).toBe("changed");
        expect(mockGetDbSetCacheValue).toHaveBeenCalledTimes(3);
        expect(mockSetDbSetCacheValue).toHaveBeenCalledTimes(2);
        expect(mockClearDbSetCache).toHaveBeenCalledTimes(2);
    });

    it('should clear cache via dbset', async () => {

        const mockGetDbSetCacheValue = jest.spyOn(cache, "getDbSetCacheValue")
        const mockSetDbSetCacheValue = jest.spyOn(cache, "setDbSetCacheValue");
        const mockClearDbSetCache = jest.spyOn(cache, "clearDbSetCache");
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());

        context.contacts.clearCache()

        expect(mockGetDbSetCacheValue).toHaveBeenCalledTimes(0);
        expect(mockSetDbSetCacheValue).toHaveBeenCalledTimes(0);
        expect(mockClearDbSetCache).toHaveBeenCalledTimes(1);
    });

    it('should clear cache via context', async () => {

        const mockGetDbSetCacheValue = jest.spyOn(cache, "getDbSetCacheValue")
        const mockSetDbSetCacheValue = jest.spyOn(cache, "setDbSetCacheValue");
        const mockClearDbSetCache = jest.spyOn(cache, "clearDbSetCache");
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());

        context.clearCache()

        expect(mockGetDbSetCacheValue).toHaveBeenCalledTimes(0);
        expect(mockSetDbSetCacheValue).toHaveBeenCalledTimes(0);
        expect(mockClearDbSetCache).toHaveBeenCalledTimes(context.dbsets.length);
    });
});