import { describe, it, expect } from 'vitest';
import { BasicDataContext } from '../contexts/BasicDataContext';


describe('Product Creation', () => {
    it('Can add a basic product', async () => {
        // Arrange
        const context = BasicDataContext.create();

        const _1 = await context.products.firstAsync();
        const _2 = await context.products.firstAsync(w => w.id != "");
        const _3 = await context.products.firstOrUndefinedAsync();
        const _4 = await context.products.firstOrUndefinedAsync(w => w.id != "");
        const _5 = await context.products.map(w => ({ id: w.id })).firstOrUndefinedAsync(w => w.id != "");
        const _6 = await context.products.map(w => w.id).countAsync();
    });


}); 