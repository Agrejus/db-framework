import { CloneObjectHandler } from "./clone/CloneObjectHandler";
import { CloneValueHandler } from "./clone/CloneValueHandler";

/// Purpose: 
export class CloneHandlerBuilder {

    build() {
        const handler = new CloneObjectHandler();
        handler.setNext(new CloneValueHandler());

        return handler;
    }
}