import { s } from '@agrejus/db-framework-core';

export const product = s.define("products", {
    id: s.string().key().identity(),
    more: s.object({
        one: s.string(),
        two: s.string()
    }),
    order: s.number().index().default((d) => d.test, { test: 1 }),
    name: s.string().index(),
    cool: s.string().index("one"),
    two: s.string().index("one")
}).modify(w => ({
    documentType: w.computed((_, t) => t).tracked()
})).compile();