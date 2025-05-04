import { describe, it, expect } from 'vitest';
import { DataContext } from '@agrejus/db-framework';
import { MemoryPlugin } from '@agrejus/db-framework-plugin-memory';
import { user } from './schemas/user';
import { product } from './schemas/product';

class BasicDataContext extends DataContext {

    constructor() {
        super(new MemoryPlugin())
    }

    users = this.dbset(user).create();
    products = this.dbset(product).create();
}

describe('Basic Data Context', () => {

    it('Can add item to users collection', async () => {
        const context = new BasicDataContext();

        const [added] = await context.users.addAsync({
            address: {
                city: "Somewhere",
                state: "MN",
                street: "Guess St",
                zip: "12345"
            },
            age: 10,
            firstName: "James",
            lastName: "DeMeuse"
        });

        // should set defaults
        expect(added.createdDate).toEqual(new Date("01/01/1900 8:00 AM"));

        const response = await context.saveChangesAsync();

        expect(response).toBe(1);

        expect(added.id).toBe(1);
        expect(added.createdDate).toEqual(new Date("01/01/1900 8:00 AM"));
        expect(added.age).toBe(10);
        expect(added.firstName).toBe("James");
        expect(added.lastName).toBe("DeMeuse");
        expect(added.address.city).toBe("Somewhere");
        expect(added.address.state).toBe("MN");
        expect(added.address.street).toBe("Guess St");
        expect(added.address.zip).toBe("12345");
    });

    it('Can add item to products collection', async () => {
        const context = new BasicDataContext();

        const [added] = await context.products.addAsync({
            category: "electronics",
            name: "Logitech G Pro Superlight",
            inStock: true,
            price: 149.99,
            tags: ["accessory", "computer"]
        });

        // Check if product was added to the context
        const response = await context.saveChangesAsync();

        // Verify one product was saved
        expect(response).toBe(1);

        // Verify product properties
        expect(added.id).toStrictEqual(expect.any(String));
        expect(added.category).toBe("electronics");
        expect(added.name).toBe("Logitech G Pro Superlight");
        expect(added.inStock).toBe(true);
        expect(added.price).toBe(149.99);
        expect(added.tags).toEqual(["accessory", "computer"]);
    });
});