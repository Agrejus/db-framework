import { ArrayBuilder, CodeBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { PropertyInfoHandler } from "../types";

export class IdSelectorValueHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.isKey) {
            let arrayBuilder = builder. getOrDefault<ArrayBuilder>("result.variable.array");
            const entitySelectorPath = property.getAssignmentPath({ parent: "entity" });

            if (arrayBuilder == null) {
                arrayBuilder = builder.get<SlotBlock>("result")
                    .variable("result", { name: "variable" })
                    .array(`${entitySelectorPath}`, { name: "array" });

                return builder;
            }


            arrayBuilder.append(`${entitySelectorPath}`);
            return builder;
        }

        return super.handle(property, builder);
    }
}