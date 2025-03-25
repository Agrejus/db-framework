import { CodeBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { SchemaTypes } from "../../schema";
import { PropertyInfoHandler } from "../types";

export class EnableChangeTrackingObjectHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.type === SchemaTypes.Object) {
            const assignmentSlot = builder.get<SlotBlock>("assignment");
            const childSelectorPath = property.getSelectrorPath({parent: "entity"});
            const childAssignmentPath = property.getAssignmentPath({parent: "entity"});

            assignmentSlot.if(`${childSelectorPath} != null`).appendBody(`${childAssignmentPath} = enableChangeTracking(${childAssignmentPath});`);
            return builder;
        }

        return super.handle(property, builder);
    }
}