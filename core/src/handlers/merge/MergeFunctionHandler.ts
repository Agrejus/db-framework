import { CodeBuilder, FunctionFactoryBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { SchemaTypes } from "../../schema";
import { PropertyInfoHandler } from "../types";

export class MergeFunctionHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.functionBody != null && property.type === SchemaTypes.Function) {

            return builder;
        }

        return super.handle(property, builder);
    }
}