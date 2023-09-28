import { DbContextFactory, ExternalDataContext } from "./shared/context";

describe('DbSet Info Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('supplying no keys should default to auto', async () => {
        const context = contextFactory.createContext(ExternalDataContext);

        expect(context.books.info().KeyType).toBe("auto")
    });
});