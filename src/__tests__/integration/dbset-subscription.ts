import { DbContextFactory, ExternalDataContext } from "./shared/context";
import { faker } from "@faker-js/faker";
import { wait } from './shared/test-utils';

describe('DbSet Subscription Tests', () => {

    const contextFactory = new DbContextFactory();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should add one entity and subscribe to changes', (done) => {
        const runner = async () => {
            const context = contextFactory.createContext(ExternalDataContext);

            context.contacts.subscribe((adds, updates, removes) => {
                expect(adds.length).toBe(1);
                expect(updates.length).toBe(0);
                expect(removes.length).toBe(0);
                expect(context.hasPendingChanges()).toBe(false);
                done();
            });

            await context.contacts.add({
                firstName: "James",
                lastName: "DeMeuse",
                phone: "111-111-1111",
                address: "1234 Test St"
            });

            await context.saveChanges();
        }

        runner();
    });

    it('should add many entities and subscribe to changes', (done) => {
        const runner = async () => {
            const context = contextFactory.createContext(ExternalDataContext);

            context.contacts.subscribe((adds, updates, removes) => {
                expect(adds.length).toBe(10);
                expect(updates.length).toBe(0);
                expect(removes.length).toBe(0);
                done();
            });

            for (let i = 0; i < 10; i++) {
                await context.contacts.add({
                    firstName: faker.name.firstName(),
                    lastName: faker.name.lastName(),
                    phone: faker.phone.phoneNumber(),
                    address: faker.address.streetAddress()
                });
            }

            await context.saveChanges();
        }

        runner();
    });

    it('should add one entity, update it, and subscribe to changes', (done) => {
        const runner = async () => {
            const context = contextFactory.createContext(ExternalDataContext);

            let callCounter = 0;
            context.contacts.subscribe((adds, updates, removes) => {
                callCounter++;

                if (callCounter === 1) {
                    expect(adds.length).toBe(1);
                    expect(updates.length).toBe(0);
                    expect(removes.length).toBe(0);
                    return
                }

                expect(adds.length).toBe(0);
                expect(updates.length).toBe(1);
                expect(removes.length).toBe(0);
                expect(callCounter).toBe(2);
                done();
            });

            await context.contacts.add({
                firstName: "James",
                lastName: "DeMeuse",
                phone: "111-111-1111",
                address: "1234 Test St"
            });

            await context.saveChanges();

            const found = await context.contacts.find(w => w.firstName === "James");

            if (found == null) {
                expect(true).toBe(false);
                return;
            }

            found.firstName = "Test";

            await context.saveChanges();
        }

        runner();
    });

    it('should add one entity, update it, and remove it, and subscribe to changes', (done) => {
        const runner = async () => {
            const context = contextFactory.createContext(ExternalDataContext);

            let callCounter = 0;
            context.contacts.subscribe((adds, updates, removes) => {
                callCounter++;

                if (callCounter === 1) {
                    expect(adds.length).toBe(1);
                    expect(updates.length).toBe(0);
                    expect(removes.length).toBe(0);
                    return
                }

                if (callCounter === 2) {
                    expect(adds.length).toBe(0);
                    expect(updates.length).toBe(1);
                    expect(removes.length).toBe(0);
                    expect(callCounter).toBe(2);
                    done();
                    return
                }

                expect(adds.length).toBe(0);
                expect(updates.length).toBe(0);
                expect(removes.length).toBe(1);
                expect(callCounter).toBe(3);
                done();
            });

            await context.contacts.add({
                firstName: "James",
                lastName: "DeMeuse",
                phone: "111-111-1111",
                address: "1234 Test St"
            });

            await context.saveChanges();

            const found = await context.contacts.find(w => w.firstName === "James");

            if (found == null) {
                expect(true).toBe(false);
                return;
            }

            found.firstName = "Test";

            await context.saveChanges();

            await context.contacts.remove(found);

            await context.saveChanges();
        }

        runner();
    });

    it('should add one entity and subscribe to changes, unsubscribe and not be called', (done) => {
        const runner = async () => {
            const context = contextFactory.createContext(ExternalDataContext);
            const fn = jest.fn();

            const unsubscribe = context.contacts.subscribe((adds, updates, removes) => {
                fn();
            });

            await context.contacts.add({
                firstName: "James",
                lastName: "DeMeuse",
                phone: "111-111-1111",
                address: "1234 Test St"
            });

            unsubscribe();

            await context.saveChanges();

            setTimeout(() => {
                expect(fn).toHaveBeenCalledTimes(0);
                done();
            }, 500);
        }

        runner();
    });

    it('should subscribe to correct dbset', (done) => {
        const runner = async () => {
            const context = contextFactory.createContext(ExternalDataContext);
            const fn = jest.fn();

            context.books.subscribe((adds, updates, removes) => {
                fn();
            });

            await context.contacts.add({
                firstName: "James",
                lastName: "DeMeuse",
                phone: "111-111-1111",
                address: "1234 Test St"
            });

            await context.saveChanges();

            setTimeout(() => {
                expect(fn).toHaveBeenCalledTimes(0);
                done();
            }, 500);
        }

        runner();
    });

    it('should add one entity, unsubscribe and not be called', (done) => {
        const runner = async () => {
            const context = contextFactory.createContext(ExternalDataContext);
            const fn = jest.fn();

            const unsubscribe = context.contacts.subscribe((adds, updates, removes) => {
                fn();
            });

            await context.contacts.add({
                firstName: "James",
                lastName: "DeMeuse",
                phone: "111-111-1111",
                address: "1234 Test St"
            });

            await context.saveChanges();

            await wait(100);

            unsubscribe();

            const found = await context.contacts.find(w => w.firstName === "James");

            if (found == null) {
                expect(true).toBe(false);
                return;
            }

            await context.contacts.remove(found);
            await context.saveChanges();
            debugger;
            setTimeout(() => {
                expect(fn).toHaveBeenCalledTimes(1);
                done();
            }, 500);
        }

        runner();
    });

    it('should change entity in subscribe and have changed be tracked', (done) => {
        const runner = async () => {
            const context = contextFactory.createContext(ExternalDataContext);

            context.contacts.subscribe((adds, updates, removes) => {

                const found = adds.find(w => w.entity.firstName === "James");

                if (found == null) {
                    expect(true).toBe(false);
                    done();
                    return;
                }

                expect(context.hasPendingChanges()).toBe(false);
                found.entity.firstName = "Test";
                expect(context.hasPendingChanges()).toBe(true);

                expect(adds.length).toBe(1);
                expect(updates.length).toBe(0);
                expect(removes.length).toBe(0);
                done();
            });

            await context.contacts.add({
                firstName: "James",
                lastName: "DeMeuse",
                phone: "111-111-1111",
                address: "1234 Test St"
            });

            await context.saveChanges();
        }

        runner();
    });
});