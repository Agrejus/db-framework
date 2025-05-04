import { s } from '@agrejus/db-framework-core';

export const order = s.define("orders", {
    id: s.string().key().identity(),
    userId: s.string(),
    productIds: s.array(s.number()),
    total: s.number(),
    status: s.string("ordered", "fulfilled", "shipped"),
    createdAt: s.date().default(() => new Date())
}).compile();