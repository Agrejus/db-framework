import { CodeBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { SchemaTypes } from "../../schema";
import { PropertyInfoHandler } from "../types";

export class EnrichmentObjectHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.type === SchemaTypes.Object && (property.isNullable || property.isOptional) === false) {
            const assignmentSlot = builder.get<SlotBlock>("factory.function.assignment");
            const childPath = property.getAssignmentPath("enriched");

            if (assignmentSlot == null) {
                throw new Error("Error building enricher, could not find slot for factory.function.assignment")
            }

            assignmentSlot.assign(childPath, { name: `[${childPath}]` }).call("enableChangeTracking", { name: "builder" });
            return builder;
        }

        return super.handle(property, builder);
    }
}