import { CodeBuilder, ObjectBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { SlotPath } from "../../common/SlotPath";
import { SchemaTypes } from "../../schema";
import { PropertyInfoHandler } from "../types";

export class PrepareValueHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.type != SchemaTypes.Object) {
            let objectBuilder = builder.getOrDefault<ObjectBuilder>("result.variable.object");
            const entitySelectorPath = property.getAssignmentPath({ parent: "entity" });

            if (objectBuilder == null) {
                objectBuilder = builder.get<SlotBlock>("result")
                    .assign("const result", { name: "variable" })
                    .object({ name: "object" });
            }

            if (property.parent == null) {
                objectBuilder.property(`${property.name}: ${entitySelectorPath}`);
                return builder;
            }

            const slotPath = new SlotPath(...property.getParentPathArray());
            objectBuilder = objectBuilder.get<ObjectBuilder>(slotPath.get());
            objectBuilder.property(`${property.name}: ${entitySelectorPath}`);
            return builder;
        }

        return super.handle(property, builder);
    }
}