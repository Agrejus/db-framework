import { HashKeyHandler } from "./hash/HashKeyHandler";
import { HashValueHandler } from "./hash/HashValueHandler";
import { HashDateHandler } from "./hash/HashDateHandler";
import { HashIdentityHandler } from "./hash/HashIdentityHandler";

/// Purpose: 
// Should ignore Id's and Identities for type Object because we want 
// to comare a new addition with what was saved in the database
export class HashHandlerBuilder {

    build() {
        const handler = new HashKeyHandler();

        handler.setNext(new HashIdentityHandler())
        .setNext(new HashDateHandler())
        .setNext(new HashValueHandler());

        return handler;
    }
}