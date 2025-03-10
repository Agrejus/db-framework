import { CodeBuilder, ObjectBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { SlotPath } from "../../common/SlotPath";
import { SchemaTypes } from "../../schema";
import { PropertyInfoHandler } from "../types";

export class EnrichmentNullableObjectHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.type === SchemaTypes.Object && (property.isNullable || property.isOptional)) {

            const slotPath = new SlotPath("factory", "function", "enriched", "object", "enriched");
            const nestedSlotPath = this.buildSlotPath(property, slotPath);

            // Generate null check for current level using parent relationships
            const entityPath = property.getSelectrorPath({ parent: "entity", assignmentType: "FORCE_NULLABLE_OR_OPTIONAL" });
            const enrichedPath = property.getAssignmentPath({ parent: "enriched" });

            const ifsSlot = builder.get<SlotBlock>("factory.function.ifs");

            if (ifsSlot == null) {
                throw new Error("Error building enricher, could not find slot for factory.function.ifs")
            }


            ifsSlot.if(`${entityPath} != null`).appendBody(`${enrichedPath} = enableChangeTracking(${enrichedPath} || {}, "${property.name}");`);

            let enriched = builder.getOrDefault<ObjectBuilder>(nestedSlotPath.get());

            if (enriched == null) {
                const enrichedSlot = builder.get<ObjectBuilder>(slotPath.get());

                if (enrichedSlot == null) {
                    throw new Error(`Error building enricher, could not find slot for ${slotPath.get()}`)
                }

                enriched = enrichedSlot.nested(property.name, property.name);
            }
            return builder;
        }

        return super.handle(property, builder);
    }
}