import { FreezePrimitiveValueHandler } from "./freeze/FreezePrimitiveValueHandler";
import { FreezeObjectHandler } from "./freeze/FreezeObjectHandler";

/// Purpose: 
export class FreezeHanderBuilder {

    build() {
        const handler = new FreezeObjectHandler();
        handler.setNext(new FreezePrimitiveValueHandler());

        return handler;
    }
}