import { CodeBuilder } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { PropertyInfoHandler } from "../types";

export class EnrichmentDefaultValueHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.defaultValue != null && typeof property.defaultValue !== "function") {

            this.setEnrichedProperty(property, builder);

            return builder;
        }

        return super.handle(property, builder);
    }
}