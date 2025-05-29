import { s, uuidv4 } from '@agrejus/db-framework-core';

export const product = s.define("products", {
    _id: s.string().key().identity(),
    _rev: s.string().identity(),
    name: s.string(),
    price: s.number(),
    category: s.string(),
    inStock: s.boolean(),
    tags: s.string("computer", "accessory").array(),
    createdDate: s.date().default(() => new Date())
}).compile();