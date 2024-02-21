import { faker } from "@faker-js/faker";
import { DbContextFactory, ExternalDataContext } from "./shared/context";
import { EntityChangeTrackingAdapter } from "../../adapters/change-tracking/EntityChangeTrackingAdapter";

describe('Change Tracking Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should not have changed properties after enhancer runs', async () => {
        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(ExternalDataContext, dbname);

        await context.books.add({
            author: "James",
            publishDate: faker.date.between('2010-01-01', '2024-01-01')
        });

        await context.saveChanges();
        const found = await context.books.find(w => w.author === "James");

        if (found != null) {

            expect((found as any)[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY]).toBeUndefined();
            expect((found as any)[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER]).toBeUndefined();
            expect((found as any)[EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY]).toBeUndefined();
            expect((found as any)[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY]).toBeUndefined();

            found.setPublishDate();

            expect((found as any)[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY]).toBeDefined();
            expect((found as any)[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER]).toBeDefined();
            expect((found as any)[EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY]).toBeDefined();
            expect((found as any)[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY]).toBeDefined();
            return;
        }

        expect(false).toBe(true);
    });

    it('should track changes', async () => {
        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(ExternalDataContext, dbname);

        await context.books.add({
            author: "James",
            publishDate: faker.date.between('2010-01-01', '2024-01-01')
        });

        await context.saveChanges();
        const found = await context.books.find(w => w.author === "James");

        if (found != null) {

            found.rejectedCount = 10;

            expect((found as any)[EntityChangeTrackingAdapter.CHANGES_ENTITY_KEY]).toBeDefined();
            expect((found as any)[EntityChangeTrackingAdapter.DIRTY_ENTITY_MARKER]).toBeDefined();
            expect((found as any)[EntityChangeTrackingAdapter.TIMESTAMP_ENTITY_KEY]).toBeDefined();
            expect((found as any)[EntityChangeTrackingAdapter.ORIGINAL_ENTITY_KEY]).toBeDefined();
            return;
        }

        expect(false).toBe(true);
    })
});