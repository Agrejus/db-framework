import { describe, it, expect } from 'vitest';
import { BasicDataContext } from '../contexts/BasicDataContext';
import { product } from '../schemas/product';
import { generateData } from '../data/generator';
import { faker } from '@faker-js/faker';


const seedData = async (context: BasicDataContext, count: number = 2) => {

    const generatedData = generateData(product, count);

    await context.products.addAsync(...generatedData);
    await context.saveChangesAsync();
}

describe('Product Creation', () => {
    it('Can add a basic product', async () => {
        // Arrange
        const context = BasicDataContext.create();
        const [item] = generateData(product, 1);

        // Act
        const [added] = await context.products.addAsync(item);
        const response = await context.saveChangesAsync();

        // Assert
        expect(response).toBe(1);
        expect(added.id).toStrictEqual(expect.any(String));
        expect(added.category).toBe(item.category);
        expect(added.name).toBe(item.name);
        expect(added.inStock).toBe(item.inStock);
        expect(added.price).toBe(item.price);
        expect(added.tags).toEqual(item.tags);
    });

    it('Can add multiple products', async () => {
        // Arrange
        const context = BasicDataContext.create();
        const items = generateData(product, 1);

        // Act
        const added = await context.products.addAsync(...items);
        const response = await context.saveChangesAsync();

        // Assert
        expect(response).toBe(2);
        expect(added).toHaveLength(2);
        added.forEach((product, index) => {
            expect(product.id).toStrictEqual(expect.any(String));
            expect(product.category).toBe(items[index].category);
            expect(product.name).toBe(items[index].name);
            expect(product.inStock).toBe(items[index].inStock);
            expect(product.price).toBe(items[index].price);
            expect(product.tags).toEqual(items[index].tags);
        });
    });

    it('toArrayAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.toArrayAsync();

        // Assert
        expect(found.length).toBe(2);
    });

    it('toArrayAsync with no seed data', async () => {
        // Arrange
        const context = BasicDataContext.create();

        // Act
        const found = await context.products.toArrayAsync();

        // Assert
        expect(found.length).toBe(0);
    });


    it('firstAsync with result', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.firstAsync();

        // Assert
        expect(found).toBeDefined();
    });

    it('firstAsync with no result', async () => {

        const context = BasicDataContext.create();

        // Act
        expect(context.products.firstAsync()).rejects.toThrow();
    });

    it('firstOrUndefinedAsync with result', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.firstOrUndefinedAsync();

        // Assert
        expect(found).toBeDefined();
    });

    it('firstOrUndefinedAsync with no result', async () => {
        // Arrange
        const context = BasicDataContext.create();

        // Act
        const found = await context.products.firstOrUndefinedAsync();

        // Assert
        expect(found).toBeUndefined();
    });

    it('everyAsync = true', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.everyAsync(w => w.id != "");

        // Assert
        expect(found).toBe(true);
    });

    it('everyAsync = false', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.everyAsync(w => w.id === "");

        // Assert
        expect(found).toBe(false);
    });

    it('someAsync = true', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.someAsync(w => w.id != "");

        // Assert
        expect(found).toBe(true);
    });

    it('someAsync = false', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.someAsync(w => w.id === "");

        // Assert
        expect(found).toBe(false);
    });

    it('where + firstAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.where(w => w.id != "").firstAsync();

        // Assert
        expect(found).toBeDefined();
    });

    it('where + firstAsync with no result found', async () => {
        // Arrange
        const context = BasicDataContext.create();

        // Act
        expect(context.products.where(w => w.id != "").firstAsync()).rejects.toThrow();
    });

    it('where + firstOrUndefinedAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.where(w => w.id != "").firstOrUndefinedAsync();

        // Assert
        expect(found).toBeDefined();
    });

    it('throws: where + firstOrUndefinedAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act/Assert
        expect(context.products.where(w => w.id === "").firstAsync()).rejects.toThrow();
    });

    it('where + someAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.where(w => w.id != "").someAsync();

        // Assert
        expect(found).toBeDefined();
    });

    it('where + toArrayAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.where(w => w.id != "").toArrayAsync();

        // Assert
        expect(found.length).toBe(2);
    });

    it('where + countAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.where(w => w.id != "").countAsync();

        // Assert
        expect(found).toBe(2);
    });

    it('where + countAsync with no data', async () => {
        // Arrange
        const context = BasicDataContext.create();

        // Act
        const found = await context.products.where(w => w.id != "").countAsync();

        // Assert
        expect(found).toBe(0);
    });

    it('where + skip + toArrayAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 100);

        // Act
        const found = await context.products.where(w => w.id != "").skip(1).toArrayAsync();

        // Assert
        expect(found.length).toBe(99);
    });

    it('where + skip + toArrayAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 100);

        // Act
        const found = await context.products.where(w => w.id != "").skip(1).take(1).toArrayAsync();

        // Assert
        expect(found.length).toBe(1);
    });

    it('map + firstOrUndefinedAsync + one property', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 100);

        // Act
        const found = await context.products.map(w => w.id).firstOrUndefinedAsync();

        // Assert
        expect(found).toBeDefined();
        expect(found).toBeTypeOf("string");
    });

    it('map + toArrayAsync + one property', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 100);

        // Act
        const found = await context.products.map(w => w.id).toArrayAsync()

        // Assert
        expect(found).toBeDefined();
        expect(found.length).toBe(100);
        expect(found[0]).toBeTypeOf("string");
    });

    it('map + firstOrUndefinedAsync + two properties', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 100);

        // Act
        const found = await context.products.map(w => ({ first: w.id, second: w.inStock })).firstOrUndefinedAsync();

        // Assert
        expect(found).toBeDefined();
        expect(found?.first).toBeDefined();
        expect(found?.second).toBeDefined();
    });

    it('removeOne', async () => {
        // Arrange
        const context = BasicDataContext.create();
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

    it('updateOne', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 2);

        // Act
        const found = await context.products.firstAsync();

        const word = faker.lorem.word()
        found.name = word;

        const response = await context.saveChangesAsync();

        expect(response).toBe(1);

        const foundAfterSave = await context.products.firstAsync(w => w.id === found.id);

        // Assert
        expect(foundAfterSave.name).toBe(word);
    });

    it('sort', async () => {
        // Arrange
        const context = BasicDataContext.create();
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
        const context = BasicDataContext.create();
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

    it('max', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const max = await context.products.map(w => w.price).maxAsync();

        all.sort((a, b) => b.price - a.price);

        expect(max).toBe(all[0].price);
    });

    it('min', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const min = await context.products.map(w => w.price).minAsync();

        all.sort((a, b) => a.price - b.price);

        expect(min).toBe(all[0].price);
    });

    it('where + min', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const min = await context.products.where(w => w.price > 100).map(w => w.price).minAsync();

        const filtered = all.filter(w => w.price > 100);
        filtered.sort((a, b) => a.price - b.price);

        expect(min).toBe(filtered[0].price);
    });

    it('sumAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const sum = await context.products.map(w => w.price).sumAsync();

        expect(all.reduce((a, v) => a + v.price, 0)).toBe(sum);
    });

    it('countAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const count = await context.products.map(w => w.price).countAsync();

        expect(all.length).toBe(count);
    });

    it('distinctAsync numbers', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const result = await context.products.map(w => w.price).distinctAsync();

        const noDups = [...new Set(all.map(w => w.price))];
        expect(result.length).toBe(noDups.length)
        expect(noDups).toStrictEqual(result);
    });

    it('where + distinctAsync numbers', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const result = await context.products.where(w => w.price > 10).map(w => w.price).distinctAsync();

        const noDups = [...new Set(all.filter(w => w.price > 10).map(w => w.price))];
        expect(result.length).toBe(noDups.length)
        expect(noDups).toStrictEqual(result);
    });

    it('distinctAsync strings', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const result = await context.products.map(w => w.name).distinctAsync();

        const noDups = [...new Set(all.map(w => w.name))];
        expect(result.length).toBe(noDups.length)
        expect(noDups).toStrictEqual(result);
    });

    it('distinctAsync dates', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const result = await context.products.map(w => w.createdDate).distinctAsync();

        const noDups = [...new Set(all.map(w => w.createdDate.toISOString()))].map(w => new Date(w));
        expect(result.length).toBe(noDups.length)
        expect(noDups).toStrictEqual(result);
    });

    it('where + sumAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context, 200);

        const all = await context.products.toArrayAsync();
        const count = await context.products.where(w => w.price > 100).map(w => w.price).sumAsync();

        const expectedSum = all.filter(w => w.price > 100).reduce((a, v) => a + v.price, 0);
        expect(expectedSum).toBe(count);
    });

    it('where + where', async () => {
        // Arrange
        const context = BasicDataContext.create();
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
        const context = BasicDataContext.create();
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