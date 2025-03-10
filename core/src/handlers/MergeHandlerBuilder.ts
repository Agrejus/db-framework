import { MergeDefaultFunctionHandler } from "./merge/MergeDefaultFunctionHandler";
import { MergePrimitiveHandler } from "./merge/MergePrimitiveHandler";
import { MergeComputedValueHandler } from "./merge/MergeComputedValueHandler";

export class MergeHandlerBuilder {

    build() {
        const handler = new MergeDefaultFunctionHandler();
        handler.setNext(new MergeComputedValueHandler())
        .setNext(new MergePrimitiveHandler());

        return handler;
    }
}