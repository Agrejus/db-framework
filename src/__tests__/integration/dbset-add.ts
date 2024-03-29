import { DbContextFactory, ExternalDataContext } from "./shared/context";
import { DocumentTypes } from "./shared/types";
import { EntityAndTag } from "../../types/dbset-types";

describe('DbSet Add Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should add entity and return reference', async () => {
        const context = contextFactory.createContext(ExternalDataContext);

        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(contact.DocumentType).toBe(DocumentTypes.Contacts);
        expect(contact._id).toBe("Contacts/James/DeMeuse");
        expect(contact._rev).not.toBeDefined();

        expect(contact.firstName).toBe("James");
        expect(contact.lastName).toBe("DeMeuse");
        expect(contact.phone).toBe("111-111-1111");
        expect(contact.address).toBe("1234 Test St");
    });

    it('should not add entity and add to internal change tracking for updates until it is saved', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.contacts.isLinked(contact)).toBe(false);
    });

    it('should add entity and add to internal change tracking for updates', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        const { adds } = await context.saveChanges();

        const [found] = adds.match(contact);

        expect(context.contacts.isLinked(found!)).toBe(true)
        expect(context.contacts.isLinked(contact)).toBe(false);
    });

    it('should only allow one single entity per dbset', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const [preference] = await context.preference.add({
            isOtherPropertyOn: true,
            isSomePropertyOn: false
        });

        expect(preference.DocumentType).toBe(DocumentTypes.Preference);
        expect(preference._id).toBe(`${DocumentTypes.Preference}/static`);
        expect(preference._rev).not.toBeDefined();

        expect(preference.isOtherPropertyOn).toBe(true);
        expect(preference.isSomePropertyOn).toBe(false);
    });

    it('should empty and add when only single document allowed', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        await context.preference.add({
            isOtherPropertyOn: true,
            isSomePropertyOn: false
        });

        await context.saveChanges();

        await context.preference.empty();
        await context.preference.add({
            isOtherPropertyOn: false,
            isSomePropertyOn: false
        });

        await context.saveChanges();

        const items = await context.preference.all();

        expect(items.length).toBe(1);
        const [item] = items;
        expect(item?.isOtherPropertyOn).toBe(false);
        expect(item?.isSomePropertyOn).toBe(false);
    });

    it('should only allow one single entity per dbset - no key', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const [preference] = await context.preferencev2.add({
            isOtherPropertyOn: true,
            isSomePropertyOn: false
        });

        expect(preference.DocumentType).toBe(DocumentTypes.PreferenceV2);
        expect(preference._id).toBe(`${DocumentTypes.PreferenceV2}`);
        expect(preference._rev).not.toBeDefined();

        expect(preference.isOtherPropertyOn).toBe(true);
        expect(preference.isSomePropertyOn).toBe(false);
    });

    it('should only allow one single entity per dbset using none from fluent builder', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const [book] = await context.booksNoKey.add({
            author: "me"
        });

        expect(book.DocumentType).toBe(DocumentTypes.BooksNoKey);
        expect(book._id).toBe(DocumentTypes.BooksNoKey);
        expect(book._rev).not.toBeDefined();

        expect(book.author).toBe("me");
    });

    it('should only allow one single entity per dbset and update one entity', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const [preference] = await context.preference.add({
            isOtherPropertyOn: true,
            isSomePropertyOn: false
        });

        expect(preference.DocumentType).toBe(DocumentTypes.Preference);
        expect(preference._id).toBe(`${DocumentTypes.Preference}/static`);
        expect(preference._rev).not.toBeDefined();

        expect(preference.isOtherPropertyOn).toBe(true);
        expect(preference.isSomePropertyOn).toBe(false);

        await context.saveChanges();

        const [preference2] = await context.preference.add({
            isOtherPropertyOn: true,
            isSomePropertyOn: false
        });

        await context.saveChanges();

        const preferences = await context.preference.all();

        expect(preferences.length).toBe(1)
    });

    it('should add entity, save, and set _rev', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        const { adds } = await context.saveChanges();

        const [saved] = adds.match(contact);

        expect(saved?.DocumentType).toBe(DocumentTypes.Contacts);
        expect(saved?._id).toBe("Contacts/James/DeMeuse");
        expect(saved?._rev).toBeDefined();

        expect(saved?.firstName).toBe("James");
        expect(saved?.lastName).toBe("DeMeuse");
        expect(saved?.phone).toBe("111-111-1111");
        expect(saved?.address).toBe("1234 Test St");

        expect(contact._rev).not.toBeDefined()
    });

    it('should add entity, save, and generate an id', async () => {
        const context = contextFactory.createContext(ExternalDataContext);

        const [note] = await context.notes.add({
            contents: "Some Note",
            createdDate: new Date(),
            userId: "jdemeuse"
        });

        const { adds } = await context.saveChanges();

        const [found] = adds.match(note);

        expect(found?.DocumentType).toBe(DocumentTypes.Notes);

        expect(found?._id).toMatch(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/)
        expect(found?._rev).toBeDefined();

        expect(found?.contents).toBe("Some Note");
        expect(found?.createdDate).toBeDefined();
        expect(found?.userId).toBe("jdemeuse");

        expect(note._id).toBeDefined();
        expect(note._rev).not.toBeDefined();
    });

    it('should add entity and create id from selector', async () => {
        const now = new Date();
        const context = contextFactory.createContext(ExternalDataContext);
        const [car] = await context.cars.add({
            make: "Chevrolet",
            manufactureDate: now,
            model: "Silverado",
            year: 2021
        });

        expect(car.DocumentType).toBe(DocumentTypes.Cars);
        expect(car._id).toBe(`${DocumentTypes.Cars}/${now.toISOString()}/Chevrolet/Silverado`);
        expect(car._rev).not.toBeDefined();

        expect(car.make).toBe("Chevrolet");
        expect(car.model).toBe("Silverado");
        expect(car.year).toBe(2021);
        expect(car.manufactureDate).toBe(now);
    });

    it('should add entity, exlude a property and set the default on the add event', async () => {
        const context = contextFactory.createContext(ExternalDataContext);

        const [book] = await context.books.add({
            author: "James DeMeuse",
            publishDate: new Date()
        });


        const { adds } = await context.saveChanges();

        const [found] = adds.match(book);

        const raw = await context.getRaw(found!._id);

        expect((raw as any).someProperty).not.toBeDefined();

        expect(found?.DocumentType).toBe(DocumentTypes.Books);
        expect(found?._id).toBeDefined();
        expect(found?._rev).toBeDefined();

        expect(found?.setPublishDate).toBeDefined();
        expect(found?.author).toBe("James DeMeuse");
        expect(found?.publishDate).toBeDefined();
        expect(found?.status).toBe("pending");
    });

    it('should add entity and return the original added object', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const [book] = await context.books.add({
            author: "James DeMeuse",
            publishDate: new Date()
        });

        const { adds } = await context.saveChanges();

        const [match] = adds.match(book);

        expect(match?.DocumentType).toBe(DocumentTypes.Books);
        expect(match?._id).toBeDefined();
        expect(match?._rev).toBeDefined();

        expect(match?.author).toBe("James DeMeuse");
        expect(match?.publishDate).toBeDefined();
        expect(match?.status).toBe("pending");
        expect(Object.prototype.toString.call(match?.publishDate)).toBe('[object Date]');

        const found = await context.books.first();

        expect(Object.prototype.toString.call(found?.publishDate)).toBe('[object String]');
    });

    it('should add entity and map the returning date', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const [book] = await context.booksWithDateMapped.add({
            author: "James DeMeuse",
            publishDate: new Date(),
            createdDate: new Date()
        });

        const { adds } = await context.saveChanges();

        const [match] = adds.match(book);

        expect(match?.DocumentType).toBe(DocumentTypes.BooksWithDateMapped);
        expect(match?._id).toBeDefined();
        expect(match?._rev).toBeDefined();

        expect(match?.author).toBe("James DeMeuse");
        expect(Object.prototype.toString.call(match?.publishDate)).toBe('[object Date]');
        expect(Object.prototype.toString.call(match?.createdDate)).toBe('[object Date]');
        expect(match?.status).toBe("pending");

        const found = await context.booksWithDateMapped.first();

        expect(Object.prototype.toString.call(found?.publishDate)).toBe('[object Date]');
        expect(Object.prototype.toString.call(found?.createdDate)).toBe('[object Date]');
    });

    it('dbset should set defaults on add', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const date = new Date();
        const [book] = await context.booksWithDefaults.add({
            author: "james",
            publishDate: date
        });

        expect(book.status).toBe("pending");
        expect(book.rejectedCount).toBe(0);
        expect(book.author).toBe("james");
        expect(book.DocumentType).toBe(DocumentTypes.BooksWithDefaults);
        expect(book.publishDate).toBe(date);
        expect(book._id).toBeDefined();
        expect(book._rev).not.toBeDefined();
    });

    it('dbset should set defaults on add - v2', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const date = new Date();
        const [book] = await context.booksWithDefaultsV2.add({
            author: "james",
            publishDate: date
        });

        expect(book.status).toBe("pending");
        expect(book.rejectedCount).toBe(0);
        expect(book.author).toBe("james");
        expect(book.DocumentType).toBe(DocumentTypes.BooksWithDefaultsV2);
        expect(book.publishDate).toBe(date);
        expect(book._id).toBeDefined();
        expect(book._rev).not.toBeDefined();
    });

    it('dbset should set defaults after fetch for add and retrieve', async () => {
        const [missingContext, context] = contextFactory.createDbContexts(name => [new ExternalDataContext(name), new ExternalDataContext(name)]);
        const date = new Date();
        await missingContext.booksWithTwoDefaults.add({
            author: "james",
            publishDate: date
        });

        await missingContext.saveChanges();

        const retrievedBook = await context.booksWithTwoDefaults.first();

        const [addedBook] = await context.booksWithTwoDefaults.add({
            author: "james",
            publishDate: date
        });

        expect(retrievedBook?.status).toBe("pending");
        expect(retrievedBook?.rejectedCount).toBe(0);
        expect(retrievedBook?.author).toBe("james");
        expect(retrievedBook?.DocumentType).toBe(DocumentTypes.BooksWithTwoDefaults);
        expect(retrievedBook?.publishDate).toBe(date.toISOString());
        expect(retrievedBook?._id).toBeDefined();
        expect(retrievedBook?._rev).toBeDefined();

        expect(addedBook.status).toBe("pending");
        expect(addedBook.rejectedCount).toBe(0);
        expect(addedBook.author).toBe("james");
        expect(addedBook.DocumentType).toBe(DocumentTypes.BooksWithTwoDefaults);
        expect(addedBook.publishDate).toBe(date);
        expect(addedBook._id).toBeDefined();
        expect(addedBook._rev).not.toBeDefined();
    });

    it('dbset should set defaults after fetch for add and retrieve for all docs', async () => {
        const [missingContext, context] = contextFactory.createDbContexts(name => [new ExternalDataContext(name), new ExternalDataContext(name)]);
        const date = new Date();
        await missingContext.booksWithTwoDefaults.add({
            author: "james",
            publishDate: date
        });

        await missingContext.saveChanges();

        const all = await context.all();
        const [retrievedBook] = context.booksWithTwoDefaults.match(...all)

        const [addedBook] = await context.booksWithTwoDefaults.add({
            author: "james",
            publishDate: date
        });

        expect(retrievedBook.status).toBe("pending");
        expect(retrievedBook.rejectedCount).toBe(0);
        expect(retrievedBook.author).toBe("james");
        expect(retrievedBook.DocumentType).toBe(DocumentTypes.BooksWithTwoDefaults);
        expect(retrievedBook.publishDate).toBe(date.toISOString());
        expect(retrievedBook._id).toBeDefined();
        expect(retrievedBook._rev).toBeDefined();

        expect(addedBook.status).toBe("pending");
        expect(addedBook.rejectedCount).toBe(0);
        expect(addedBook.author).toBe("james");
        expect(addedBook.DocumentType).toBe(DocumentTypes.BooksWithTwoDefaults);
        expect(addedBook.publishDate).toBe(date);
        expect(addedBook._id).toBeDefined();
        expect(addedBook._rev).not.toBeDefined();
    });

    it('should create an instance and link - same as adding', async () => {
        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(ExternalDataContext, dbname);

        const [contact] = context.contacts.instance({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(false);

        const result = await context.saveChanges();

        expect(result.adds.length).toEqual(0);
        expect(result.removes.length).toEqual(0);
        expect(result.updates.deltas.length).toEqual(0);
        expect(result.updates.docs.length).toEqual(0);
        expect(result.updates.originals.length).toEqual(0);

        await context.contacts.add(contact)

        expect(context.hasPendingChanges()).toBe(true);

        const afterLinkCount = await context.saveChanges();

        expect(afterLinkCount.successes_count).toBe(1);

        const found = context.contacts.first();

        expect(found).toBeDefined();
    });

    it('booksv3 - should add entity, exlude a property and set the default on the add event', async () => {
        const context = contextFactory.createContext(ExternalDataContext);
        const [book] = await context.booksV3.add({
            author: "me",
            rejectedCount: 1,
            publishDate: new Date()
        });

        expect(book.SyncRetryCount).toBe(0);
        expect(book.SyncStatus).toBe("Pending");

        const { adds } = await context.saveChanges();

        const [match] = adds.match(book);

        expect(match?.DocumentType).toBe(DocumentTypes.BooksV3);
        expect(match?._id).toBeDefined();
        expect(match?._rev).toBeDefined();

        expect(match?.author).toBe("me");
        expect(match?.publishDate).toBeDefined();
    });

    it('should insert and add with auto generated id', async () => {

        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(ExternalDataContext, dbname);

        const all = await context.notes.all();

        expect(all.length).toEqual(0);

        const [one] = await context.notes.upsert({
            contents: "some contents",
            createdDate: new Date(),
            userId: "some user"
        });

        expect(context.hasPendingChanges()).toEqual(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toEqual(false);

        const [two] = await context.notes.upsert({
            contents: "some contents",
            createdDate: new Date(),
            userId: "some user"
        });

        expect(context.hasPendingChanges()).toEqual(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toEqual(false);

        const allAfterAdd = await context.notes.all();
        expect(allAfterAdd.length).toEqual(2);

        const foundOne = await context.notes.find(w => w._id === one._id);

        expect(foundOne).toBeDefined();

        const [upsertedOne, upsertedTwo] = await context.notes.upsert({
            _id: one._id,
            contents: "changed contents",
            createdDate: new Date(),
            userId: "changed user"
        }, {
            contents: "changed contents 2",
            createdDate: new Date(),
            userId: "changed user 2"
        });

        expect(upsertedOne._id).toEqual(one._id);
        expect(context.hasPendingChanges()).toEqual(true);

        await context.saveChanges();
        expect(context.hasPendingChanges()).toEqual(false);

        const foundUpsertOne = await context.notes.find(w => w._id === one._id);

        expect(upsertedOne.createdDate.toISOString()).toEqual(foundUpsertOne?.createdDate)
        expect(foundUpsertOne?.contents).toEqual("changed contents");
        expect(foundUpsertOne?.userId).toEqual("changed user");

        const foundUpsertTwo = await context.notes.find(w => w._id === upsertedTwo._id);
        expect(foundUpsertTwo?.contents).toEqual("changed contents 2");
        expect(foundUpsertTwo?.userId).toEqual("changed user 2");

        const final = await context.notes.all();
        expect(final.length).toEqual(3);
    });

    it('should append meta data to one entity', (done) => {
        const metaData = "Some Meta"
        const dbName = contextFactory.getRandomDbName();
        let calls = 0;
        const context = contextFactory.createContext(class extends ExternalDataContext {

            async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }): Promise<void> {
                calls++;
                const changes = getChanges();
                expect(changes.adds.length).toBe(1);
                expect(changes.adds[0].entity).toBeTruthy();
                expect(changes.adds[0].tag).toBe(metaData);
                expect(calls).toBe(1)
                done();
            }

        }, dbName);

        context.books.tag(metaData).add({
            author: "James"
        }).then(() => context.saveChanges());
    });

    it('should not append meta data to one entity', (done) => {
        const dbName = contextFactory.getRandomDbName();
        let calls = 0;
        const context = contextFactory.createContext(class extends ExternalDataContext {

            async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }): Promise<void> {
                calls++;
                const changes = getChanges();
                expect(changes.adds.length).toBe(1);
                expect(changes.adds[0].entity).toBeTruthy();
                expect(changes.adds[0].tag).toBeFalsy();
                expect(calls).toBe(1)
                done();
            }

        }, dbName);

        context.books.add({
            author: "James"
        }).then(() => context.saveChanges());
    });

    it('should append meta data to many entities', (done) => {
        const tag = "Some Meta"
        const dbName = contextFactory.getRandomDbName();
        let calls = 0;
        const context = contextFactory.createContext(class extends ExternalDataContext {

            async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }): Promise<void> {
                calls++;
                const changes = getChanges();
                expect(changes.adds.length).toBe(2);
                expect(changes.adds[0].entity).toBeTruthy();
                expect(changes.adds[0].tag).toBe(tag);

                expect(changes.adds[1].entity).toBeTruthy();
                expect(changes.adds[1].tag).toBe(tag);

                expect(calls).toBe(1)
                done();
            }

        }, dbName);

        context.books.tag(tag).add({
            author: "James"
        }, {
            author: "Megan"
        }).then(() => context.saveChanges());
    });

    it('should append meta data to many entities in different transactions', (done) => {
        const tag = "Some Meta"
        const dbName = contextFactory.getRandomDbName();
        let calls = 0;
        const context = contextFactory.createContext(class extends ExternalDataContext {

            async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }): Promise<void> {
                calls++;
                const changes = getChanges();

                expect(changes.adds.length).toBe(2);
                expect(changes.adds[0].entity).toBeTruthy();
                expect(changes.adds[0].tag).toBe(tag);

                expect(changes.adds[1].entity).toBeTruthy();
                expect(changes.adds[1].tag).toBe(tag);

                expect(calls).toBe(1)
                done();
            }

        }, dbName);

        context.books.tag(tag).add({
            author: "James"
        }).then(() => {

            context.books.tag(tag).add({
                author: "Megan"
            }).then(() => {

                context.saveChanges();
            })

        });
    });

    it('should append meta to first transaction and not the second', (done) => {
        const tag = "Some Meta"
        const dbName = contextFactory.getRandomDbName();
        let calls = 0;
        const context = contextFactory.createContext(class extends ExternalDataContext {

            async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }): Promise<void> {
                calls++;
                const changes = getChanges();

                if (calls === 1) {
                    expect(changes.adds.length).toBe(1);
                    expect(changes.adds[0].entity).toBeTruthy();
                    expect(changes.adds[0].tag).toBe(tag);
                }

                if (calls === 2) {
                    expect(changes.adds.length).toBe(1);
                    expect(changes.adds[0].entity).toBeTruthy();
                    expect(changes.adds[0].tag).toBeFalsy();
                }

                if (calls === 2) {
                    done();
                }
            }

        }, dbName);

        context.books.tag(tag).add({
            author: "James"
        }).then(() => {

            context.saveChanges().then(() => {

                context.books.add({
                    author: "Megan"
                }).then(() => {
                    context.saveChanges();
                })
            })
        });
    });
});