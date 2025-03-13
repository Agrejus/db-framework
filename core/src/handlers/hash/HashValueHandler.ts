import { CodeBuilder, SlotBlock, StringBuilder } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { SchemaTypes } from "../../schema";
import { PropertyInfoHandler } from "../types";

export class HashValueHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.type !== SchemaTypes.Object) {
            let stringBuilder = builder.getOrDefault<StringBuilder>("hash-object-return.variable.string");
            const entitySelectorPath = property.getSelectrorPath({ parent: "entity" });

            if (stringBuilder == null) {
                stringBuilder = builder.get<SlotBlock>("hash-object-return")
                    .assign("const result", { name: "variable" })
                    .string("template", { name: "string" });
            }

            stringBuilder.append("${" + entitySelectorPath + "}")

            return builder;
        }

        return super.handle(property, builder);
    }
}