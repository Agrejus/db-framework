import { CodeBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { PropertyInfoHandler } from "../types";

export class HashTypeValueHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.isKey && property.isIdentity) {
            const slot = builder.get<SlotBlock>("ifs");
            const entitySelectorPath = property.getSelectrorPath({ parent: "entity" });

            slot.if(`${entitySelectorPath} == null`).appendBody(`return "Object"`);

            return builder;
        }

        return super.handle(property, builder);
    }
}