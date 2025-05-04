import { describe, it, expect } from 'vitest';
import { BasicDataContext } from '../contexts/BasicDataContext';

type ProductTag = 'accessory' | 'computer';

interface ProductData {
    category: string;
    name: string;
    inStock: boolean;
    price: number;
    tags: ProductTag[];
}

const seedData = async (context: BasicDataContext) => {

    const products: ProductData[] = [
        {
            category: "electronics",
            name: "Keyboard",
            inStock: true,
            price: 99.99,
            tags: ["accessory", "computer"]
        },
        {
            category: "electronics",
            name: "Mouse",
            inStock: false,
            price: 49.99,
            tags: ["accessory"]
        }
    ]
    await context.products.addAsync(...products);
    await context.saveChangesAsync();
}

describe('Product Creation', () => {
    it('Can add a basic product', async () => {
        // Arrange
        const context = BasicDataContext.create();
        const productData: ProductData = {
            category: "electronics",
            name: "Logitech G Pro Superlight",
            inStock: true,
            price: 149.99,
            tags: ["accessory", "computer"]
        };

        // Act
        const [added] = await context.products.addAsync(productData);
        const response = await context.saveChangesAsync();

        // Assert
        expect(response).toBe(1);
        expect(added.id).toStrictEqual(expect.any(String));
        expect(added.category).toBe(productData.category);
        expect(added.name).toBe(productData.name);
        expect(added.inStock).toBe(productData.inStock);
        expect(added.price).toBe(productData.price);
        expect(added.tags).toEqual(productData.tags);
    });

    it('Can add multiple products', async () => {
        // Arrange
        const context = BasicDataContext.create();
        const products: ProductData[] = [
            {
                category: "electronics",
                name: "Keyboard",
                inStock: true,
                price: 99.99,
                tags: ["accessory", "computer"]
            },
            {
                category: "electronics",
                name: "Mouse",
                inStock: false,
                price: 49.99,
                tags: ["accessory"]
            }
        ];

        // Act
        const added = await context.products.addAsync(...products);
        const response = await context.saveChangesAsync();

        // Assert
        expect(response).toBe(2);
        expect(added).toHaveLength(2);
        added.forEach((product, index) => {
            expect(product.id).toStrictEqual(expect.any(String));
            expect(product.category).toBe(products[index].category);
            expect(product.name).toBe(products[index].name);
            expect(product.inStock).toBe(products[index].inStock);
            expect(product.price).toBe(products[index].price);
            expect(product.tags).toEqual(products[index].tags);
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

    it('firstAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.firstAsync();

        // Assert
        expect(found).toBeDefined();
    });

    it('firstOrUndefinedAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.firstOrUndefinedAsync();

        // Assert
        expect(found).toBeDefined();
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

    it('where + skip + toArrayAsync', async () => {
        // Arrange
        const context = BasicDataContext.create();
        await seedData(context);

        // Act
        const found = await context.products.where(w => w.id != "").skip(1).toArrayAsync();

        // Assert
        expect(found.length).toBe(1);
    });
}); 