import { describe, it, expect, vi } from 'vitest';
import { BasicDataContext } from '../contexts/BasicDataContext';
import { product } from '../schemas/product';
import { generateData } from '../data/generator';
import { faker } from '@faker-js/faker';

// we can solve this by having a common interface each schema adheres to
// Then we can create a schema for each database to ensure we test everything

const wait = (ms: number) => new Promise<void>((resolve) => {

    let sum = 0;
    const run = () => {
        if (sum >= ms) {
            resolve();
            return;
        }
        sum += 5;
        setTimeout(run, 5);
    }

    run();
});

const seedData = async (context: BasicDataContext, count: number = 2) => {

    const generatedData = generateData(product, count);

    await context.products.addAsync(...generatedData);
    await context.saveChangesAsync();
}

describe('add', () => {
    it('Can add a basic product', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        const [item] = generateData(product, 1);

        // Act
        const [added] = await context.products.addAsync(item);
        const response = await context.saveChangesAsync();

        // Assert
        expect(response).toBe(1);
        expect(added._id).toStrictEqual(expect.any(String));
        expect(added.category).toBe(item.category);
        expect(added.name).toBe(item.name);
        expect(added.inStock).toBe(item.inStock);
        expect(added.price).toBe(item.price);
        expect(added.tags).toEqual(item.tags);
    });

    it('Can add multiple products', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        const items = generateData(product, 2);

        // Act
        const added = await context.products.addAsync(...items);
        const response = await context.saveChangesAsync();

        // Assert
        expect(response).toBe(2);
        expect(added).toHaveLength(2);
        added.forEach((product, index) => {
            expect(product._id).toStrictEqual(expect.any(String));
            expect(product.category).toBe(items[index].category);
            expect(product.name).toBe(items[index].name);
            expect(product.inStock).toBe(items[index].inStock);
            expect(product.price).toBe(items[index].price);
            expect(product.tags).toEqual(items[index].tags);
        });
    });
});

describe('remove', () => {
    it('removeOne', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 2);

        // Act
        const found = await context.products.firstAsync();

        await context.products.removeAsync(found);

        const response = await context.saveChangesAsync();

        expect(response).toBe(1);

        const all = await context.products.toArrayAsync();

        // Assert
        expect(all.length).toBe(1);
    });

});

describe('update', () => {
    it('updateOne', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 2);

        // Act
        const found = await context.products.firstAsync();

        const word = faker.lorem.word()
        found.name = word;

        const response = await context.saveChangesAsync();

        expect(response).toBe(1);

        const foundAfterSave = await context.products.firstAsync(w => w._id === found._id);

        // Assert
        expect(foundAfterSave.name).toBe(word);
    });
});

describe('toArray', () => {
    it('all records', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.toArrayAsync();

        // Assert
        expect(found.length).toBe(2);
    });

    it('toArrayAsync with no seed data', async () => {
        // Arrange
        await using context = BasicDataContext.create();

        // Act
        const found = await context.products.toArrayAsync();

        // Assert
        expect(found.length).toBe(0);
    });

    it('where + skip + toArrayAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 100);

        // Act
        const found = await context.products.where(w => w._id != "").skip(1).toArrayAsync();

        // Assert
        expect(found.length).toBe(99);
    });

    it('where + skip + toArrayAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 2);

        // Act
        const found = await context.products.where(w => w._id != "").sort(w => w.name).skip(1).take(1).toArrayAsync();

        // Assert
        expect(found.length).toBe(1);
    });

    it('where + toArrayAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.where(w => w._id != "").toArrayAsync();

        // Assert
        expect(found.length).toBe(2);
    });

    it('map + toArrayAsync + one property', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 100);

        // Act
        const found = await context.products.map(w => w._id).toArrayAsync()

        // Assert
        expect(found).toBeDefined();
        expect(found.length).toBe(100);
        expect(found[0]).toBeTypeOf("string");
    });

    it('sort', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const sorted = await context.products.sort(w => w.price).toArrayAsync();

        let last: null | number = null;

        for (const item of sorted) {
            if (last == null) {
                last = item.price;
                continue;
            }

            expect(last).toBeLessThanOrEqual(item.price);
            last = item.price;
        }
    });

    it('sort descending', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const sorted = await context.products.sortDescending(w => w.price).toArrayAsync();

        let last: null | number = null;

        for (const item of sorted) {
            if (last == null) {
                last = item.price;
                continue;
            }

            expect(last).toBeGreaterThanOrEqual(item.price);
            last = item.price;
        }
    });

    it('where + where', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const count = await context.products.where(w => w.price > 100).where(w => w.name.startsWith("s")).toArrayAsync();

        const expectedSum = all.filter(w => w.price > 100 && w.name.startsWith("s"));

        expectedSum.sort();
        count.sort();

        expect(expectedSum).toStrictEqual(count);
    });

    it('where + sort + toArrayAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const result = await context.products
            .where(w => w.price > 100)
            .sortDescending(w => w.price)
            .map(w => w.price)
            .toArrayAsync();

        const expected = all.filter(w => w.price > 100).map(w => w.price);

        expected.sort((a, b) => b - a)


        expect(expected).toStrictEqual(result);
    });
});

describe('first', () => {

    it('firstAsync with result', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.firstAsync();

        // Assert
        expect(found).toBeDefined();
    });

    it('firstAsync with no result', async () => {

        await using context = BasicDataContext.create();

        // Act
        expect(context.products.firstAsync()).rejects.toThrow();
    });

    it('where + firstAsync with no result found', async () => {
        // Arrange
        await using context = BasicDataContext.create();

        // Act
        expect(context.products.where(w => w._id != "").firstAsync()).rejects.toThrow();
    });

    it('where + firstAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.where(w => w._id != "").firstAsync();

        // Assert
        expect(found).toBeDefined();
    });

    it('throws: where + firstAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act/Assert
        expect(context.products.where(w => w._id === "").firstAsync()).rejects.toThrow();
    });
});

describe('firstOrUndefined', () => {

    it('firstOrUndefinedAsync with result', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.firstOrUndefinedAsync();

        // Assert
        expect(found).toBeDefined();
    });

    it('firstOrUndefinedAsync with no result', async () => {
        // Arrange
        await using context = BasicDataContext.create();

        // Act
        const found = await context.products.firstOrUndefinedAsync();

        // Assert
        expect(found).toBeUndefined();
    });

    it('where + firstOrUndefinedAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.where(w => w._id != "").firstOrUndefinedAsync();

        // Assert
        expect(found).toBeDefined();
    });

    it('map + firstOrUndefinedAsync + one property', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 100);

        // Act
        const found = await context.products.map(w => w._id).firstOrUndefinedAsync();

        // Assert
        expect(found).toBeDefined();
        expect(found).toBeTypeOf("string");
    });

    it('map + firstOrUndefinedAsync + two properties', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 100);

        // Act
        const found = await context.products.map(w => ({ first: w._id, second: w.inStock })).firstOrUndefinedAsync();

        // Assert
        expect(found).toBeDefined();
        expect(found?.first).toBeDefined();
        expect(found?.second).toBeDefined();
    });
});

describe("subscribe", () => {

    it('not subscribed should not fire when data changes + firstOrUndefined has query', async () => {

        const callback = vi.fn();
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        context.products.where(w => w._id != "").firstOrUndefined(w => w._id !== "", callback);

        await context.products.addAsync(...generateData(product, 1));
        await context.saveChangesAsync();

        await wait(500);

        // Assert
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBeDefined();
        expect(callback.mock.calls[0][1]).toBeUndefined();
    });

    it('subscribe should fire when data changes + firstOrUndefined has query', async () => {

        const callback = vi.fn();
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        context.products.subscribe().where(w => w._id != "").firstOrUndefined(w => w._id !== "", callback);

        await context.products.addAsync(...generateData(product, 1));
        await context.saveChangesAsync();

        await wait(500);

        // Assert
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.mock.calls[0][0]).toBeDefined();
        expect(callback.mock.calls[0][1]).toBeUndefined();

        expect(callback.mock.calls[1][0]).toBeDefined();
        expect(callback.mock.calls[1][1]).toBeUndefined();
    });

    it('not subscribed should not fire when data changes + firstOrUndefined has query', async () => {

        const callback = vi.fn();
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        context.products.where(w => w._id != "").firstOrUndefined(w => w._id !== "", callback);

        await context.products.addAsync(...generateData(product, 1));
        await context.saveChangesAsync();

        await wait(500);

        // Assert
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBeDefined();
        expect(callback.mock.calls[0][1]).toBeUndefined();
    });

    it('subscribe should fire when data changes + firstOrUndefined has no query', async () => {

        const callback = vi.fn();
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        context.products.subscribe().where(w => w._id != "").firstOrUndefined(callback);

        await context.products.addAsync(...generateData(product, 1));
        await context.saveChangesAsync();

        await wait(500);

        // Assert
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.mock.calls[0][0]).toBeDefined();
        expect(callback.mock.calls[0][1]).toBeUndefined();

        expect(callback.mock.calls[1][0]).toBeDefined();
        expect(callback.mock.calls[1][1]).toBeUndefined();
    });

    it('subscribe should fire when data changes + toArray', async () => {

        const callback = vi.fn();
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        context.products.subscribe().where(w => w._id != "").toArray(callback);

        await context.products.addAsync(...generateData(product, 1));
        await context.saveChangesAsync();

        await wait(500);

        // Assert
        expect(callback).toHaveBeenCalledTimes(2);
        expect(Array.isArray(callback.mock.calls[0][0])).toBe(true);
        expect(callback.mock.calls[0][1]).toBeUndefined();

        expect(Array.isArray(callback.mock.calls[1][0])).toBe(true);
        expect(callback.mock.calls[1][1]).toBeUndefined();
    });

    it('subscribe should fire when data changes + sum', async () => {

        const callback = vi.fn();
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        context.products.subscribe().where(w => w._id != "").map(w => w.price).sum(callback);

        await context.products.addAsync(...generateData(product, 1));
        await context.saveChangesAsync();

        await wait(500);

        // Assert
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.mock.calls[0][0]).toBeTypeOf("number");
        expect(callback.mock.calls[0][0]).toBeGreaterThan(0);
        expect(callback.mock.calls[0][1]).toBeUndefined();

        expect(callback.mock.calls[1][0]).toBeTypeOf("number");
        expect(callback.mock.calls[1][0]).toBeGreaterThan(0);
        expect(callback.mock.calls[1][1]).toBeUndefined();
    });

    it('subscribe should fire when data changes + count', async () => {

        const callback = vi.fn();
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        context.products.subscribe().where(w => w._id != "").map(w => w.price).count(callback);

        await context.products.addAsync(...generateData(product, 1));
        await context.saveChangesAsync();

        await wait(500);

        // Assert
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.mock.calls[0][0]).toBeTypeOf("number");
        expect(callback.mock.calls[0][0]).toBe(2);
        expect(callback.mock.calls[0][1]).toBeUndefined();

        expect(callback.mock.calls[1][0]).toBeTypeOf("number");
        expect(callback.mock.calls[1][0]).toBe(3);
        expect(callback.mock.calls[1][1]).toBeUndefined();
    });

    it('subscribe should fire when data changes + max', async () => {

        const callback = vi.fn();
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        context.products.subscribe().where(w => w._id != "").map(w => w.price).max(callback);

        await context.products.addAsync(...generateData(product, 1));
        await context.saveChangesAsync();

        await wait(500);

        // Assert
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.mock.calls[0][0]).toBeTypeOf("number");
        expect(callback.mock.calls[0][0]).toBeGreaterThan(0);
        expect(callback.mock.calls[0][1]).toBeUndefined();

        expect(callback.mock.calls[1][0]).toBeTypeOf("number");
        expect(callback.mock.calls[1][0]).toBeGreaterThan(0);
        expect(callback.mock.calls[1][1]).toBeUndefined();
    });

    it('subscribe should fire when data changes + min', async () => {

        const callback = vi.fn();
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        context.products.subscribe().where(w => w._id != "").map(w => w.price).min(callback);

        await context.products.addAsync(...generateData(product, 1));
        await context.saveChangesAsync();

        await wait(500);

        // Assert
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.mock.calls[0][0]).toBeTypeOf("number");
        expect(callback.mock.calls[0][0]).toBeGreaterThan(0);
        expect(callback.mock.calls[0][1]).toBeUndefined();

        expect(callback.mock.calls[1][0]).toBeTypeOf("number");
        expect(callback.mock.calls[1][0]).toBeGreaterThan(0);
        expect(callback.mock.calls[1][1]).toBeUndefined();
    });

    it('subscribe should fire when data changes + distinct', async () => {

        const callback = vi.fn();
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        context.products.subscribe().where(w => w._id != "").map(w => w.price).distinct(callback);

        await context.products.addAsync(...generateData(product, 1));
        await context.saveChangesAsync();

        await wait(500);

        // Assert
        expect(callback).toHaveBeenCalledTimes(2);
        expect(Array.isArray(callback.mock.calls[0][0])).toBe(true);
        expect(callback.mock.calls[0][1]).toBeUndefined();

        expect(Array.isArray(callback.mock.calls[1][0])).toBe(true);
        expect(callback.mock.calls[1][1]).toBeUndefined();
    });
});

describe('every', () => {
    it('everyAsync = true', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.everyAsync(w => w._id != "");

        // Assert
        expect(found).toBe(true);
    });

    it('everyAsync = false', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.everyAsync(w => w._id === "");

        // Assert
        expect(found).toBe(false);
    });
});

describe('some', () => {
    it('someAsync = true', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.someAsync(w => w._id != "");

        // Assert
        expect(found).toBe(true);
    });

    it('someAsync = false', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.someAsync(w => w._id === "");

        // Assert
        expect(found).toBe(false);
    });

    it('where + someAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.where(w => w._id != "").someAsync();

        // Assert
        expect(found).toBeDefined();
    });
});

describe('count', () => {

    it('countAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const count = await context.products.map(w => w.price).countAsync();

        expect(all.length).toBe(count);
    });

    it('where + countAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.where(w => w._id != "").countAsync();

        // Assert
        expect(found).toBe(2);
    });

    it('where + countAsync with no data', async () => {
        // Arrange
        await using context = BasicDataContext.create();

        // Act
        const found = await context.products.where(w => w._id != "").countAsync();

        // Assert
        expect(found).toBe(0);
    });
});

describe('max', () => {
    it('max', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const max = await context.products.map(w => w.price).maxAsync();

        all.sort((a, b) => b.price - a.price);

        expect(max).toBe(all[0].price);
    });
});

describe('min', () => {
    it('min', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const min = await context.products.map(w => w.price).minAsync();

        all.sort((a, b) => a.price - b.price);

        expect(min).toBe(all[0].price);
    });

    it('where + min', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const min = await context.products.where(w => w.price > 100).map(w => w.price).minAsync();

        const filtered = all.filter(w => w.price > 100);
        filtered.sort((a, b) => a.price - b.price);

        expect(min).toBe(filtered[0].price);
    });
});

describe('sum', () => {
    it('sumAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const sum = await context.products.map(w => w.price).sumAsync();

        expect(all.reduce((a, v) => a + v.price, 0)).toBe(sum);
    });

    it('where + sumAsync', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const count = await context.products.where(w => w.price > 100).map(w => w.price).sumAsync();

        const expectedSum = all.filter(w => w.price > 100).reduce((a, v) => a + v.price, 0);
        expect(expectedSum).toBe(count);
    });
});

describe('distinct', () => {
    it('distinctAsync numbers', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const result = await context.products.map(w => w.price).distinctAsync();

        const noDups = [...new Set(all.map(w => w.price))];
        expect(result.length).toBe(noDups.length)
        expect(noDups).toStrictEqual(result);
    });

    it('where + distinctAsync numbers', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const result = await context.products.where(w => w.price > 10).map(w => w.price).distinctAsync();

        const noDups = [...new Set(all.filter(w => w.price > 10).map(w => w.price))];
        expect(result.length).toBe(noDups.length)
        expect(noDups).toStrictEqual(result);
    });

    it('distinctAsync strings', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const result = await context.products.map(w => w.name).distinctAsync();

        const noDups = [...new Set(all.map(w => w.name))];
        expect(result.length).toBe(noDups.length)
        expect(noDups).toStrictEqual(result);
    });

    it('distinctAsync dates', async () => {
        // Arrange
        await using context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const result = await context.products.map(w => w.createdDate).distinctAsync();

        const noDups = [...new Set(all.map(w => w.createdDate.toISOString()))].map(w => new Date(w));
        expect(result.length).toBe(noDups.length)
        expect(noDups).toStrictEqual(result);
    });
});