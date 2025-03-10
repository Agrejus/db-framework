import { StripObjectHandler } from "./strip/StripObjectHandler";
import { StripValueHandler } from "./strip/StripValueHandler";
import { StripKeyHandler } from "./strip/StripKeyHandler";
import { StripIdentityHandler } from "./strip/StripIdentityHandler";

export class StripHandlerBuilder {

    build() {
        const handler = new StripIdentityHandler();

        handler.setNext(new StripKeyHandler())
        .setNext(new StripObjectHandler())
        .setNext(new StripValueHandler());

        return handler;
    }
}