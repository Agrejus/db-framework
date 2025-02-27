import { CodeBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { SchemaTypes } from "../../schema";
import { PropertyInfoHandler } from "../types";

export class EnrichmentObjectIdentityHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.isIdentity === true && property.type == SchemaTypes.Object) {
            // do nothing right now
            return builder;
        }

        return super.handle(property, builder);
    }
}