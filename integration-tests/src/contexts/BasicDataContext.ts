import { DataContext } from '@agrejus/db-framework';
// import { MemoryPlugin } from '@agrejus/db-framework-plugin-memory';
import { user } from '../schemas/user';
import { product } from '../schemas/product';
import { inventoryItem } from '../schemas/inventoryItem';
import { event } from '../schemas/event';
import { order } from '../schemas/order';
import { blogPost } from '../schemas/blogPost';
import { comment } from '../schemas/comments';
import { uuidv4 } from '@agrejus/db-framework-core';
import { PouchDbPlugin } from '@agrejus/db-framework-plugin-pouchdb';

export class BasicDataContext extends DataContext {
    constructor(dbname: string) {
        //super(new MemoryPlugin(dbname))
        super(new PouchDbPlugin(dbname));
    }

    // need to use stateful sets too
    users = this.dbset(user).create();
    products = this.dbset(product).create();
    inventoryItems = this.dbset(inventoryItem).create();
    events = this.dbset(event).create();
    orders = this.dbset(order).create();
    blogPosts = this.dbset(blogPost).create();
    comments = this.dbset(comment).create();

    static create() {
        return new BasicDataContext(uuidv4());
    }

    async [Symbol.asyncDispose]() {
        await this.destroyAsync();
    }
} 