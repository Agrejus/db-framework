import { DeserializeObjectHandler } from "./deserialize/DeserializeObjectHandler";
import { DeserializeValueHandler } from "./deserialize/DeserializeValueHandler";

/// Purpose: 
export class DeserializeHandlerBuilder {

    build() {
        const handler = new DeserializeObjectHandler();
        handler.setNext(new DeserializeValueHandler());

        return handler;
    }
}