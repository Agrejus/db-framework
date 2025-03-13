import { CompareObjectHandler } from "./compare/CompareObjectHandler";
import { CompareValueHandler } from "./compare/CompareValueHandler";

/// Purpose: 
export class CompareHandlerBuilder {

    build() {
        const handler = new CompareObjectHandler();
        handler.setNext(new CompareValueHandler());

        return handler;
    }
}