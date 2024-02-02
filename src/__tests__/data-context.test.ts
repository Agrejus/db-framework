import { v4 as uuidv4 } from 'uuid';
import { DataContext } from '../context/DataContext';
import { IDbRecord } from '../types/entity-types';
import { PouchDbPlugin } from '@agrejus/db-framework-plugin-pouchdb';
import { ContextOptions } from '../types/context-types';

describe('data context', () => {

    const dbs: { [key: string]: DataContext<DocumentTypes, IDbRecord<DocumentTypes>> } = {}
    const dbFactory = <T extends typeof ExternalDataContext>(Context: T, dbname?: string) => {
        const name = dbname ?? `${uuidv4()}-db`;
        const result = new Context(name);
        dbs[name] = result;
        return result;
    }

    enum DocumentTypes {
        Notes = "Notes",
        NotesTest = "NotesTest",
        ExtendedNotes = "ExtendedNotes",
        Contacts = "Contacts",
        ExtendedContacts = "ExtendedContacts",
        Books = "Books",
        ExtendedBooks = "ExtendedBooks"
    }

    interface IContact extends IDbRecord<DocumentTypes> {
        firstName: string;
        lastName: string;
        address: string;
        phone: string;
    }

    interface INote extends IDbRecord<DocumentTypes> {
        contents: string;
        createdDate: Date;
        userId: string;
    }

    interface IBook extends IDbRecord<DocumentTypes> {
        author: string;
        publishDate?: Date;
        rejectedCount: number;
        status: "pending" | "approved" | "rejected";
    }

    class ExternalDataContext extends DataContext<DocumentTypes, IDbRecord<DocumentTypes>> {

        constructor(name: string, contextOptions: ContextOptions = { changeTrackingType: "entity" }) {
            super({ dbName: name.endsWith("-db") ? name : `${name}-db` }, PouchDbPlugin, contextOptions);
        }

        contextId() {
            return ExternalDataContext.name
        }

        async empty() {
            for (let dbset of this) {
                await dbset.empty();
            }

            await this.saveChanges();
        }

        notes = this.dbset().default<INote>(DocumentTypes.Notes).create();
        contacts = this.dbset().default<IContact>(DocumentTypes.Contacts).keys(w => w.add("firstName").add("lastName")).create();
        books = this.dbset().default<IBook>(DocumentTypes.Books).exclude("status").create();
    }

    class CreateDbOverrideContext extends ExternalDataContext {

        constructor(name: string) {
            super(name.endsWith("-db") ? name : `${name}-db`);
        }
    }

    afterAll(async () => {
        const dbNames = Object.keys(dbs)
        await Promise.all(dbNames.map(w => dbs[w].destroyDatabase()));
    })

    it('should save changes when entity is added and a non auto generated id', async () => {
        const context = dbFactory(ExternalDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        const { adds } = await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const contacts = await context.contacts.all();

        const [found] = adds.match(contact)!;

        expect(contacts.length).toBe(1);
        expect(found._id).toBeDefined();
        expect(found._rev).toBeDefined();
        expect(found.DocumentType).toBe(DocumentTypes.Contacts)
    });

    it('should save changes when entities are added and a non auto generated id', async () => {

        const context = dbFactory(ExternalDataContext);

        const [one, two] = await context.contacts.add({
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

        expect(context.hasPendingChanges()).toBe(true);
        const { adds } = await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const contacts = await context.contacts.all();

        const [foundOne, foundTwo] = adds.match(one, two);

        expect(contacts.length).toBe(2);
        expect(foundOne._id).toBeDefined();
        expect(foundOne._rev).toBeDefined();
        expect(foundOne.DocumentType).toBe(DocumentTypes.Contacts);

        expect(foundTwo._id).toBeDefined();
        expect(foundTwo._rev).toBeDefined();
        expect(foundTwo.DocumentType).toBe(DocumentTypes.Contacts);
    });

    it('should add entity with auto generated id', async () => {
        const context = dbFactory(ExternalDataContext);
        const [note] = await context.notes.add({
            contents: "some new note",
            createdDate: new Date(),
            userId: "jdemeuse"
        });

        expect(context.hasPendingChanges()).toBe(true);
        const { adds } = await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const notes = await context.notes.all();

        expect(notes.length).toBe(1);

        const [found] = adds.match(note)!;

        expect(found._id).toBeDefined();
        expect(found._rev).toBeDefined();
        expect(found.DocumentType).toBeDefined();
    });


    it('should save changes when more than one entity is added', async () => {

        const context = dbFactory(ExternalDataContext);
        const [first, second] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "Other",
            lastName: "Person",
            phone: "111-111-1111",
            address: "6789 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        const { adds } = await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const contacts = await context.contacts.all();

        const [foundFirst, foundSecond] = adds.match(first, second);

        expect(contacts.length).toBe(2);
        expect(foundFirst._id).toBeDefined();
        expect(foundFirst._rev).toBeDefined();
        expect(foundFirst.DocumentType).toBe(DocumentTypes.Contacts);
        expect(foundSecond._id).toBeDefined();
        expect(foundSecond._rev).toBeDefined();
        expect(foundSecond.DocumentType).toBe(DocumentTypes.Contacts);
    });

    it('should save changes when entity is removed', async () => {

        const context = dbFactory(ExternalDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        const { adds } = await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        expect(contacts.length).toBe(1);

        const [foundContact] = adds.match(contact)!;

        await context.contacts.remove(foundContact);

        expect(context.hasPendingChanges()).toBe(true);

        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        contacts = await context.contacts.all();

        expect(contacts.length).toBe(0);
    });

    it('should save changes when entities are removed', async () => {

        const context = dbFactory(ExternalDataContext);
        const [first, second] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "Other",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "6789 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        const { adds } = await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        expect(contacts.length).toBe(2);

        const found = adds.match(first, second);

        await context.contacts.remove(...found);

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        contacts = await context.contacts.all();

        expect(contacts.length).toBe(0);
    });

    it('should save changes when entities are removed by id', async () => {

        const context = dbFactory(ExternalDataContext);
        const [first, second] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "Other",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "6789 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        expect(contacts.length).toBe(2);

        await context.contacts.remove(first._id, second._id);

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        contacts = await context.contacts.all();

        expect(contacts.length).toBe(0);
    });

    it('should save changes when entity is updated', async () => {

        const context = dbFactory(ExternalDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        const [foundContact] = contacts

        expect(contacts.length).toBe(1);

        foundContact.firstName = "Changed";

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const updated = await context.contacts.all();

        expect(updated.length).toBe(1);
        expect(updated[0].firstName).toBe("Changed");
    });

    it('should show no changes when property is set to same value', async () => {

        const context = dbFactory(ExternalDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        expect(contacts.length).toBe(1);

        contact.firstName = "Changed";

        contact.firstName = "James";

        expect(context.hasPendingChanges()).toBe(false);
    });

    it('should save changes when two of the same entities with different references are updated', async () => {

        const context = dbFactory(ExternalDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        let contacts = await context.contacts.all();

        expect(contacts.length).toBe(1);

        const [foundContact] = contacts
        foundContact.firstName = "Changed";

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const updated = await context.contacts.all();

        expect(updated.length).toBe(1);
        expect(updated[0].firstName).toBe("Changed");

        const [change] = updated;

        change.firstName = "Next";

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const last = await context.contacts.all();

        expect(last.length).toBe(1);
        expect(last[0].firstName).toBe("Next");
    });

    it('should get all data', async () => {

        const context = dbFactory(ExternalDataContext);

        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.notes.add({
            contents: "some new note",
            createdDate: new Date(),
            userId: "jdemeuse"
        });

        await context.books.add({
            author: "James DeMeuse",
            rejectedCount: 1,
            publishDate: new Date()
        })

        expect(context.hasPendingChanges()).toBe(true);
        await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const all = await context.getAllDocs();

        expect(all.length).toBe(3);
    });

    it('should iterate over dbsets', async () => {
        const interation = jest.fn();
        const context = dbFactory(ExternalDataContext);

        for (let dbset of context) {
            interation();
        }

        expect(interation).toHaveBeenCalledTimes(3);
    });

    it('should override createdb function', async () => {
        const context = dbFactory(CreateDbOverrideContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(true);
        const { adds } = await context.saveChanges();
        expect(context.hasPendingChanges()).toBe(false);

        const contacts = await context.contacts.all();

        const [found] = adds.match(contact);

        expect(contacts.length).toBe(1);
        expect(found._id).toBeDefined();
        expect(found._rev).toBeDefined();
        expect(found.DocumentType).toBe(DocumentTypes.Contacts)
    });


    it('should set one default with dbset fluent api using fluent dbset builder', async () => {

        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).defaults({ contents: "some contents" });
        }

        const context = dbFactory(FluentContext) as FluentContext;

        expect((context.dbsetTest as any)._params.defaults).toEqual({ add: { contents: "some contents" }, retrieve: { contents: "some contents" } });
    });

    it('should set one default for adding with dbset fluent api using fluent dbset builder', async () => {

        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).defaults({ add: { contents: "some contents" } });
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.defaults).toEqual({ add: { contents: "some contents" }, retrieve: {} });
    });

    it('should set one default for retrieving with dbset fluent api using fluent dbset builder', async () => {

        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).defaults({ retrieve: { contents: "some contents" } });
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.defaults).toEqual({ add: {}, retrieve: { contents: "some contents" } });
    });

    it('should allow add and retrieve defaults to be different with dbset fluent api using fluent dbset builder', async () => {

        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).defaults({ retrieve: { contents: "some contents" }, add: { contents: "other contents" } });
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.defaults).toEqual({ add: { contents: "other contents" }, retrieve: { contents: "some contents" } });
    });

    it('should set many defaults with dbset fluent api using fluent dbset builder', async () => {

        const date = new Date()
        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).defaults({ contents: "some contents", createdDate: date, userId: "jdemeuse" });
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.defaults).toEqual({ add: { contents: "some contents", createdDate: date, userId: "jdemeuse" }, retrieve: { contents: "some contents", createdDate: date, userId: "jdemeuse" } });
    });

    it('should set many defaults for adding with dbset fluent api using fluent dbset builder', async () => {

        const date = new Date()
        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).defaults({ add: { contents: "some contents", createdDate: date, userId: "jdemeuse" } });
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.defaults).toEqual({ add: { contents: "some contents", createdDate: date, userId: "jdemeuse" }, retrieve: {} });
    });

    it('should set many defaults for retrieving with dbset fluent api using fluent dbset builder', async () => {

        const date = new Date()
        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).defaults({ retrieve: { contents: "some contents", createdDate: date, userId: "jdemeuse" } });
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.defaults).toEqual({ add: {}, retrieve: { contents: "some contents", createdDate: date, userId: "jdemeuse" } });
    });

    it('should allow defaults to be called more than once and append to defaults using fluent dbset builder', async () => {

        const date = new Date()
        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).defaults({ contents: "some contents" }).defaults({ createdDate: date }).defaults({ userId: "jdemeuse" });
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.defaults).toEqual({ add: { contents: "some contents", createdDate: date, userId: "jdemeuse" }, retrieve: { contents: "some contents", createdDate: date, userId: "jdemeuse" } });
    });

    it('should allow defaults to be called more than once when adding and append to defaults using fluent dbset builder', async () => {

        const date = new Date()
        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).defaults({ add: { contents: "some contents" } }).defaults({ add: { createdDate: date } }).defaults({ add: { userId: "jdemeuse" } });
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.defaults).toEqual({ add: { contents: "some contents", createdDate: date, userId: "jdemeuse" }, retrieve: {} });
    });

    it('should allow defaults to be called more than once when retrieving and append to defaults using fluent dbset builder', async () => {

        const date = new Date()
        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).defaults({ retrieve: { contents: "some contents" } }).defaults({ retrieve: { createdDate: date } }).defaults({ retrieve: { userId: "jdemeuse" } });
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.defaults).toEqual({ add: {}, retrieve: { contents: "some contents", createdDate: date, userId: "jdemeuse" } });
    });

    it('should allow defaults to be called more than once when adding and retrieving and append to defaults using fluent dbset builder', async () => {

        const date = new Date()
        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).defaults({ add: { contents: "some contents" } }).defaults({ add: { userId: "other" } }).defaults({ retrieve: { createdDate: date } }).defaults({ retrieve: { userId: "jdemeuse" } });
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.defaults).toEqual({ add: { contents: "some contents", userId: "other" }, retrieve: { createdDate: date, userId: "jdemeuse" } });
    });

    it('should exclude one property using fluent dbset builder', async () => {

        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).exclude("contents");
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.exclusions).toEqual(["contents"]);
    });

    it('should exclude many properties using fluent dbset builder', async () => {

        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).exclude("contents", "createdDate");
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.exclusions).toEqual(["contents", "createdDate"]);
    });

    it('should allow exclude to be called more than once and exclude many properties using fluent dbset builder', async () => {

        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name);
            }

            dbsetTest = this.dbset().default<INote>(DocumentTypes.Notes).exclude("contents").exclude("createdDate");
        }

        const context = dbFactory(FluentContext) as FluentContext

        expect((context.dbsetTest as any)._params.exclusions).toEqual(["contents", "createdDate"]);
    });

    it('should save correctly with context tracking', async () => {

        class FluentContext extends ExternalDataContext {

            constructor(name: string) {
                super(name, { changeTrackingType: "context" });
            }

            books2 = this.dbset().default<IBook>(DocumentTypes.ExtendedBooks).create();
        }

        const context = dbFactory(FluentContext) as FluentContext

        const [book] = await context.books2.add({
            author: "James",
            rejectedCount: 1,
            publishDate: new Date(),
            status: "pending"
        });

        await context.saveChanges();

        const found = await context.books2.find(w => w._id === book._id);

        if (found == null) {
            expect(1).toBe(2);
            return;
        }

        found.status = "rejected";
        await context.saveChanges();

        found.status = "approved";
        await context.saveChanges();
    });
});