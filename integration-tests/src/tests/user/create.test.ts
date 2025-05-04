import { describe, it, expect } from 'vitest';
import { createTestContext, testData } from '../common/setup';

describe('User Creation', () => {
    it('Can add a basic user', async () => {
        // Arrange
        const context = createTestContext();
        const userData = testData.users[0];

        // Act
        const [added] = await context.users.addAsync(userData);
        const response = await context.saveChangesAsync();

        // Assert
        expect(response).toBe(1);
        expect(added.id).toBe(1);
        expect(added.firstName).toBe(userData.firstName);
        expect(added.lastName).toBe(userData.lastName);
        expect(added.age).toBe(userData.age);
        expect(added.address).toEqual(userData.address);
    });

    it('Can add multiple users', async () => {
        // Arrange
        const context = createTestContext();

        // Act
        const added = await context.users.addAsync(...testData.users);
        const response = await context.saveChangesAsync();

        // Assert
        expect(response).toBe(2);
        expect(added).toHaveLength(2);
        added.forEach((user, index) => {
            expect(user.id).toBe(index + 1);
            expect(user.firstName).toBe(testData.users[index].firstName);
            expect(user.lastName).toBe(testData.users[index].lastName);
            expect(user.age).toBe(testData.users[index].age);
            expect(user.address).toEqual(testData.users[index].address);
        });
    });

    it('Validates required user fields', async () => {
        // Arrange
        const context = createTestContext();
        const invalidUser = {
            firstName: "John",
            // Missing lastName
            age: 30,
            address: {
                street: "123 Main St",
                city: "Anytown",
                state: "CA",
                zip: "12345"
            }
        };

        // Act & Assert
        await expect(context.users.addAsync(invalidUser as any))
            .rejects
            .toThrow();
    });
}); 