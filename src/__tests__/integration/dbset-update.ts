import { EntityChangeTrackingAdapter } from "../../adapters/change-tracking/EntityChangeTrackingAdapter";
import { DataContext } from "../../context/DataContext";
import { DbContextFactory, ExternalDataContext } from "./shared/context";

describe('DbSet Update Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should update an entity with previous rev', async () => {

        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(ExternalDataContext, dbname);
        const [newBook] = await context.books.add({
            author: "James",
            publishDate: new Date()
        });


        const { adds } = await context.saveChanges();

        const [found] = adds.match(newBook);

        if (found == null) {
            expect(false).toBe(true);
            return;
        }

        expect(found._rev).toBeDefined();

        const book = await context.books.first();

        context.books.unlink(book!);

        const secondBook = await context.books.first();
        secondBook!.author = "DeMeuse"
        await context.saveChanges();

        const secondaryContext = contextFactory.createContext(ExternalDataContext, dbname);

        const [linkedBook] = await secondaryContext.books.link(book!);

        linkedBook.author = "James DeMeuse";

        const { updates } = await secondaryContext.saveChanges();

        const [updatedBook] = updates.docs.match(linkedBook)!;

        expect(updatedBook?._rev.startsWith("3")).toBe(true)
    });

    it('should should add and update in one transaction', async () => {

        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(ExternalDataContext, dbname);

        const all = await context.contacts.all();

        expect(all.length).toBe(0);

        const [one] = await context.contacts.upsert({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const [foundOne] = await context.contacts.all();

        expect(foundOne._id).toEqual(one._id);
        expect(foundOne._rev).not.toEqual(one._rev);

        const [two, three] = await context.contacts.upsert({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "222-222-2222",
            address: "6789 Test St"
        }, {
            firstName: "Other",
            lastName: "DeMeuse",
            phone: "333-333-3333",
            address: "0000 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const foundAll = await context.contacts.all();

        expect(foundAll.find(w => w._id === two._id)?._id).toEqual(two._id);
        expect(foundAll.find(w => w._id === two._id)?.address).toEqual(two.address);
        expect(foundAll.find(w => w._id === two._id)?.phone).toEqual(two.phone);
        expect(foundAll.find(w => w._id === three._id)?._id).toEqual(three._id);

        expect(EntityChangeTrackingAdapter.isProxy(one)).toBe(true);
        expect(EntityChangeTrackingAdapter.isProxy(two)).toBe(true);
        expect(EntityChangeTrackingAdapter.isProxy(three)).toBe(true);
    });

    it('should update an entity from the save result and save again', async () => {

        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(ExternalDataContext, dbname);
        const [newBook] = await context.books.add({
            author: "Tester McTester",
            publishDate: new Date()
        });


        const { adds } = await context.saveChanges();

        const [found] = adds.match(newBook);

        if (found == null) {
            expect(false).toBe(true);
            return;
        }

        expect(found._rev).toBeDefined();

        found.author = "Other McTester";

        const hasPendingChanges = context.hasPendingChanges();
        expect(hasPendingChanges).toBe(true)
        await context.saveChanges();

        const book = await context.books.first();

        expect(book?.author).toBe("Other McTester")
    });
});