import { MergeDefaultFunctionHandler } from "./merge/MergeDefaultFunctionHandler";
import { MergePrimitivePropertyHandler } from "./merge/MergePrimitivePropertyHandler";

export class MergeHandlerBuilder {

    build() {
        const handler = new MergeDefaultFunctionHandler();
        handler.setNext(new MergePrimitivePropertyHandler());

        return handler;
    }
}