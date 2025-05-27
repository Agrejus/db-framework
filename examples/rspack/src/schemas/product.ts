import { s } from '@agrejus/db-framework-core';

export const product = s.define("products", {
    _id: s.string().key().identity(),
    more: s.object({
        one: s.string(),
        two: s.string()
    }),
    _rev: s.string().identity(),
    order: s.number().default((d) => d.test, { test: 1 }),
    name: s.string(),
    child: s.object({
        name: s.string(),
        nested: s.object({
            winner: s.number(),
            more: s.object({
                final: s.number(),
                array: s.array(s.string())
            })
        })
    })
}).modify(w => ({
    documentType: w.computed((_, t) => t).tracked()
})).compile();