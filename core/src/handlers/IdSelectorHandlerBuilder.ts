import { IdSelectorValueHandler } from "./idSelector/IdSelectorValueHandler";
/// Purpose: 
export class IdSelectorHandlerBuilder {

    build() {
        const handler = new IdSelectorValueHandler();

        return handler;
    }
}