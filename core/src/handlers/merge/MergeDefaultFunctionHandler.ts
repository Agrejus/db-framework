import { CodeBuilder, FunctionFactoryBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { PropertyInfoHandler } from "../types";

export class MergeDefaultFunctionHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        // we only want this to run if the value for the property is null
        // we are changing merge to be more like enrich so we can handle injections
        // we may need to change more.  Need to move towards factories
        if (property.defaultValue != null && typeof property.defaultValue === "function") {
            const defaultFunctionParameters: string[] = [];

            if (property.injected != null) {
                const factory = builder.get<FunctionFactoryBuilder>("factory");
                const parameter = factory.createParameter(property.injected);
                factory.parameters(parameter);

                defaultFunctionParameters.push(parameter.name);
            }

            const ifsSlot = builder.get<SlotBlock>("factory.function.ifs");
            // we only want to run if the destination is null
            const selectorPath = property.getSelectrorPath({ parent: "destination" });
            const assignmentPath = property.getAssignmentPath({ parent: "destination" });

            const declarationsSlot = builder.get<SlotBlock>("factory.function.header");
            const defaultFunctionWithParameters = this.toNamedFunction(property.defaultValue.toString(), declarationsSlot);

            defaultFunctionWithParameters.builder.parameters(...defaultFunctionParameters.map((w, i) => ({ name: defaultFunctionWithParameters.parameters[i], callName: w })));


            ifsSlot.if(`${selectorPath} == null`).appendBody(`${assignmentPath} = ${defaultFunctionWithParameters.builder.toCallable()}`);
            return builder;
        }

        return super.handle(property, builder);
    }
}