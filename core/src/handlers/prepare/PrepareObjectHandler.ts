import { CodeBuilder, ObjectBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { SlotPath } from "../../common/SlotPath";
import { SchemaTypes } from "../../schema";
import { PropertyInfoHandler } from "../types";

export class PrepareObjectHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.type === SchemaTypes.Object) {
            const slotPath = new SlotPath("result", "variable", "object");
            let objectBuilder = builder.getOrDefault<ObjectBuilder>(slotPath.get());

            // There is a chance this is the first property we handle,
            // if that is the case, the main result variable will not be
            // constructed yet
            if (objectBuilder == null) {
                objectBuilder = builder.get<SlotBlock>("result")
                    .assign("const result", { name: "variable" })
                    .object({ name: "object" });
            }

            if (property.parent == null) {
                objectBuilder.nested(property.name, property.name)

                return builder;
            }

            slotPath.push(...property.getParentPathArray());
            const nestedObjectBuilder = builder.get<ObjectBuilder>(slotPath.get());
            nestedObjectBuilder.nested(property.name, property.name)

            return builder;
        }

        return super.handle(property, builder);
    }
}