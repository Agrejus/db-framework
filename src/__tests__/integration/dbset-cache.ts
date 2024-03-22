import { DbContextFactory, ExternalDataContext } from "./shared/context";
import { v4 as uuidv4 } from 'uuid';
import { memoryCache } from '../../cache/MemoryCache';

describe('DbSet Cache Tests', () => {

    const contextFactory = new DbContextFactory();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should add entity and not use cache', async () => {
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());

        const mockGetDbSetCacheValue = jest.spyOn(memoryCache, "get");
        const mockSetDbSetCacheValue = jest.spyOn(memoryCache, "put");
        const mockClearDbSetCache = jest.spyOn(memoryCache, "remove");
        const cacheKey = 'ExternalDataContext:Cache:Contacts';

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const found = await context.contacts.find(w => w.firstName === "James");

        expect(found).toBeDefined();
        expect(mockGetDbSetCacheValue).not.toHaveBeenCalledWith(cacheKey);
        expect(mockSetDbSetCacheValue).not.toHaveBeenCalledWith(cacheKey, expect.anything());
        expect(mockClearDbSetCache).toHaveBeenCalled();
    });

    it('should add entity and cache', async () => {
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());
        const cacheKey = 'ExternalDataContext:Cache:Contacts';

        const mockGetDbSetCacheValue = jest.spyOn(memoryCache, "get")
        const mockSetDbSetCacheValue = jest.spyOn(memoryCache, "put");
        const mockClearDbSetCache = jest.spyOn(memoryCache, "remove");

        const [added] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const found = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");

        expect(mockClearDbSetCache).toHaveBeenCalledTimes(2); // clears the cache for ttl and regular
        expect(found).toBeDefined();
        expect(mockGetDbSetCacheValue).toHaveBeenCalledWith(cacheKey);
        expect(mockSetDbSetCacheValue).toHaveBeenCalledWith(cacheKey, {
            cache: {
                all: {
                    test: {
                        [added._id]: {
                            ...added,
                            _rev: expect.any(String)
                        }
                    }
                }
            },
            data: {
                [added._id]: {
                    ...added,
                    _rev: expect.any(String)
                }
            }
        });
    });

    it('should add entity and use cache on second call', async () => {
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());

        const cacheKey = 'ExternalDataContext:Cache:Contacts';

        const mockGetDbSetCacheValue = jest.spyOn(memoryCache, "get")
        const mockSetDbSetCacheValue = jest.spyOn(memoryCache, "put");
        const mockClearDbSetCache = jest.spyOn(memoryCache, "remove");

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        expect(mockSetDbSetCacheValue).toHaveBeenCalledTimes(1);
        const mockGetCalls = mockGetDbSetCacheValue.mock.calls.length;
        const found = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");
        expect(mockSetDbSetCacheValue).toHaveBeenCalledTimes(2);
        expect(mockGetDbSetCacheValue.mock.calls.length).toBe(mockGetCalls + 3);

        if (found == null) {
            expect(1).toBe(2);
            return;
        }

        expect(mockSetDbSetCacheValue).toHaveBeenNthCalledWith(2, cacheKey, {
            cache: {
                all: {
                    test: {
                        [found._id]: {
                            ...found,
                            _rev: expect.any(String)
                        }
                    }
                }
            },
            data: {
                [found._id]: {
                    ...found,
                    _rev: expect.any(String)
                }
            }
        });

        const mockGetCallsSecond = mockGetDbSetCacheValue.mock.calls.length;
        const foundCached = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");
        expect(mockGetDbSetCacheValue.mock.calls.length).toBe(mockGetCallsSecond + 1);
        expect(mockSetDbSetCacheValue).toHaveBeenCalledTimes(2);
        expect(mockGetDbSetCacheValue).toHaveBeenNthCalledWith(mockGetDbSetCacheValue.mock.calls.length, cacheKey);


        expect(mockGetDbSetCacheValue).toHaveBeenCalledWith(cacheKey);
        expect(found).toBeDefined();
        expect(foundCached?.firstName).toBe("James");
        expect(foundCached?.lastName).toBe("DeMeuse");
        expect(foundCached?.phone).toBe("111-111-1111");
        expect(foundCached?.address).toBe("1234 Test St");
        expect(mockGetDbSetCacheValue).toHaveBeenNthCalledWith(mockGetDbSetCacheValue.mock.calls.length - 1, cacheKey);
        expect(mockSetDbSetCacheValue).toHaveBeenCalled();
        expect(mockClearDbSetCache).toHaveBeenCalledTimes(2);
    });

    it('should add entity and save changes when cached entity is changed', async () => {
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());
        const cacheKey = 'ExternalDataContext:Cache:Contacts';

        const mockGetDbSetCacheValue = jest.spyOn(memoryCache, "get")
        const mockSetDbSetCacheValue = jest.spyOn(memoryCache, "put");
        const mockClearDbSetCache = jest.spyOn(memoryCache, "remove");

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const found = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");
        const foundCached = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");

        if (foundCached == null || found == null) {
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
        expect(mockGetDbSetCacheValue).toHaveBeenCalledWith(cacheKey);
        expect(mockSetDbSetCacheValue).toHaveBeenCalledWith(cacheKey, {
            cache: {
                all: {
                    test: {
                        [found._id]: {
                            ...found,
                            _rev: expect.any(String)
                        }
                    }
                }
            },
            data: {
                [found._id]: {
                    ...found,
                    _rev: expect.any(String)
                }
            }
        });
        expect(mockClearDbSetCache).toHaveBeenCalledTimes(4);
    });

    it('should clear cache via dbset', async () => {
        const mockClearDbSetCache = jest.spyOn(memoryCache, "remove");
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());

        context.contacts.clearCache()

        expect(mockClearDbSetCache).toHaveBeenCalledTimes(2);
    });

    it('should clear cache via context', async () => {

        const mockClearDbSetCache = jest.spyOn(memoryCache, "remove");
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());

        context.clearCache()

        expect(mockClearDbSetCache).toHaveBeenCalledTimes(context.dbsets.length * 2);
    });

    it('should clear dbset but not others that have not changed', async () => {
        const context = contextFactory.createContext(ExternalDataContext, uuidv4());
        const mockClearDbSetCache = jest.spyOn(memoryCache, "remove");

        await context.books.add({
            author: "James",
            publishDate: new Date()
        });

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        expect(mockClearDbSetCache).toHaveBeenCalledTimes(4);
        expect(mockClearDbSetCache).toHaveBeenNthCalledWith(1, 'ExternalDataContext:Cache:Books');
        expect(mockClearDbSetCache).toHaveBeenNthCalledWith(2, 'ExternalDataContext:TtlCache:Books');
        expect(mockClearDbSetCache).toHaveBeenNthCalledWith(3, 'ExternalDataContext:Cache:Contacts');
        expect(mockClearDbSetCache).toHaveBeenNthCalledWith(4, 'ExternalDataContext:TtlCache:Contacts');

        const found = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");
        const foundCached = await context.contacts.useCache({ key: "test" }).find(w => w.firstName === "James");

        if (foundCached == null || found == null) {
            expect(1).toBe(2);
            return;
        }

        foundCached.address = "changed";

        await context.saveChanges();

        expect(mockClearDbSetCache).toHaveBeenCalledTimes(6);
        expect(mockClearDbSetCache).toHaveBeenNthCalledWith(3, 'ExternalDataContext:Cache:Contacts');
        expect(mockClearDbSetCache).toHaveBeenNthCalledWith(4, 'ExternalDataContext:TtlCache:Contacts');
    });
});