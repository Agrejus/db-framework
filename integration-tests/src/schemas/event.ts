import { s } from '@agrejus/db-framework-core';

export const event = s.define("events", {
    id: s.string().key().identity(),
    name: s.string(),
    location: s.string().optional(),
    startTime: s.date(),
    endTime: s.date().optional(),
    description: s.string().optional(),
    isOnline: s.boolean()
}).compile();