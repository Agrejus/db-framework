import { CodeBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { SchemaTypes } from "../../schema";
import { PropertyInfoHandler } from "../types";

export class EnrichmentPrimitiveIdentityHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.isIdentity === true && property.type != SchemaTypes.Object) {
            const selectorPath = property.getSelectrorPath("entity", { forceNullableOrOptional: true });
            const slot = builder.get<SlotBlock>("factory.function.ifs");
            const entitySelectorPath = property.getAssignmentPath("entity");
            const enrichedAssignmentPath = property.getAssignmentPath("enriched");

            slot.if(`${selectorPath} != null`).appendBody(`${enrichedAssignmentPath} = ${entitySelectorPath}`);
            return builder;
        }

        return super.handle(property, builder);
    }
}