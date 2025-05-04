import { s } from '@agrejus/db-framework-core';

export const inventoryItem = s.define("inventoryItems", {
    sku: s.string().key().identity(),
    name: s.string(),
    quantity: s.number(),
    warehouseLocation: s.string().optional(),
    restockDate: s.date().optional(),
    discontinued: s.boolean()
}).modify(w => ({
    collectionName: w.computed((_, collectionName) => collectionName).tracked(),
    wasRestocked: w.function((x) => x.restockDate != null)
})).compile();