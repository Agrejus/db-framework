import { CodeBuilder } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { PropertyInfoHandler } from "../types";

export class StripIdentityHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.isIdentity === true) {
            return builder;
        }

        return super.handle(property, builder);
    }
}