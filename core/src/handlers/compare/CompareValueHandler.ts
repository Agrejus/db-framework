import { AndBuilder, CodeBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { SchemaTypes } from "../../schema";
import { PropertyInfoHandler } from "../types";

export class CompareValueHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.type != SchemaTypes.Object) {
            let compare = builder.getOrDefault<AndBuilder>("result.variable.compare");
            const leftCompare = property.getSelectrorPath({ parent: "a" });
            const rightCompare = property.getSelectrorPath({ parent: "b" });

            if (compare == null) {
                compare = builder.get<SlotBlock>("result")
                    .assign("const result", { name: "variable" })
                    .and(`${leftCompare} === ${rightCompare}`, { name: "compare" });
                return builder;
            }

            compare.and(`${leftCompare} === ${rightCompare}`);
            return builder;
        }

        return super.handle(property, builder);
    }
}