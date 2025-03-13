import { HashTypeValueHandler } from "./hashType/HashTypeValueHandler";

/// Purpose: 
export class HashTypeHandlerBuilder {

    build() {
        const handler = new HashTypeValueHandler();

        return handler;
    }
}