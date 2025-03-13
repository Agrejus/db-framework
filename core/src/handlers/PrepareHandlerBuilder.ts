import { PrepareIdentityHandler } from "./prepare/PrepareIdentityHandler";
import { PrepareKeyHandler } from "./prepare/PrepareKeyHandler";
import { PrepareValueHandler } from "./prepare/PrepareValueHandler";
import { PrepareObjectHandler } from "./prepare/PrepareObjectHandler";

/// Purpose: 
export class PrepareHandlerBuilder {

    build() {
        const handler = new PrepareIdentityHandler();
        handler.setNext(new PrepareKeyHandler())
        .setNext(new PrepareObjectHandler())
        .setNext(new PrepareValueHandler());

        return handler;
    }
}