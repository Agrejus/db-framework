import { DbContextFactory } from "./shared/context";

describe('DbSet Info Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

});