import { s } from '@agrejus/db-framework-core';

export const user = s.define("users", {
    id: s.number().key().identity(),
    firstName: s.string(),
    lastName: s.string(),
    age: s.number(),
    createdDate: s.date().default(() => new Date("01/01/1900 8:00 AM")),
    address: s.object({
        street: s.string(),
        city: s.string(),
        state: s.string(),
        zip: s.string()
    })
}).compile();