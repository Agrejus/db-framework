import { s } from '@agrejus/db-framework-core';

export const comment = s.define("comments", {
    postId: s.string().key().identity(),
    author: s.object({
        id: s.string(),
        username: s.string()
    }),
    content: s.string(),
    replies: s.object({
        userId: s.string(),
        content: s.string()
    }).array(),
    createdAt: s.date().default(() => new Date())
}).compile();