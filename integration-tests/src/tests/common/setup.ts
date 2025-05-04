import { BasicDataContext } from '../../contexts/BasicDataContext';
import { product } from '../../schemas/product';
import { user } from '../../schemas/user';
import { order } from '../../schemas/order';
import { blogPost } from '../../schemas/blogPost';
import { inventoryItem } from '../../schemas/inventoryItem';

type ProductTag = 'accessory' | 'computer';

// Common test data
export const testData = {
    products: [
        {
            category: "electronics",
            name: "Keyboard",
            inStock: true,
            price: 99.99,
            tags: ["accessory", "computer"] as ProductTag[]
        },
        {
            category: "electronics",
            name: "Mouse",
            inStock: false,
            price: 49.99,
            tags: ["accessory"] as ProductTag[]
        }
    ],
    users: [
        {
            firstName: "John",
            lastName: "Doe",
            age: 30,
            address: {
                street: "123 Main St",
                city: "Anytown",
                state: "CA",
                zip: "12345"
            }
        },
        {
            firstName: "Jane",
            lastName: "Smith",
            age: 25,
            address: {
                street: "456 Oak Ave",
                city: "Somewhere",
                state: "NY",
                zip: "67890"
            }
        }
    ]
};

// Helper function to create a fresh context for each test
export function createTestContext() {
    return BasicDataContext.create();
}

// Helper function to seed test data
export async function seedTestData(context: BasicDataContext) {
    await context.products.addAsync(...testData.products);
    await context.users.addAsync(...testData.users);
    await context.saveChangesAsync();
} 