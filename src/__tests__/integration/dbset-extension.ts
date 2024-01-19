import { faker } from "@faker-js/faker";
import { DbContextFactory, ExternalDataContext } from "./shared/context";

describe('DbSet Extension Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('extended dbset should call base methods with no issues - v2', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        await context.overrideContactsV2.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const first = await context.overrideContactsV2.otherFirst();

        expect(first).toBeDefined();
    });

    it('should extend dbset more than once and methods should work', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        await context.overrideContactsV3.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const otherFirst = await context.overrideContactsV3.otherFirst();
        const otherOtherFirst = await context.overrideContactsV3.otherOtherFirst();

        expect(otherFirst).toBeDefined();
        expect(otherOtherFirst).toBeDefined();
    });
});