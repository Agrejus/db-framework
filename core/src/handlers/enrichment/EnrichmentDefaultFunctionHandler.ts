import { CodeBuilder, FunctionFactoryBuilder, SlotBlock } from "../../common/CodeBlock";
import { PropertyInfo } from "../../common/PropertyInfo";
import { PropertyInfoHandler } from "../types";

export class EnrichmentDefaultFunctionHandler extends PropertyInfoHandler {

    override handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {

        if (property.defaultValue != null && typeof property.defaultValue === "function") {

            this.setEnrichedProperty(property, builder);

            // we need to add the call for this function too, want to create an if
            const declarationsSlot = builder.get<SlotBlock>("factory.function.declarations");

            if (property.injected != null) {

                const factory = builder.get<FunctionFactoryBuilder>("factory");

                if (factory == null) {
                    throw new Error("Error building enricher, could not find slot for factory")
                }

                const parameter = factory.createParameter(property.injected);
                factory.parameters(parameter);

                const defaultFunctionWithParameters = this.toNamedFunction(property.defaultValue.toString(), declarationsSlot);
                // This is ok, defaults can only inject one parameter anyways
                defaultFunctionWithParameters.builder.parameters(...defaultFunctionWithParameters.parameters.map(w => ({ name: w, callName: parameter.name })));


                const ifsSlot = builder.get<SlotBlock>("factory.function.ifs");
                const enrichedAssignmentPath = property.getAssignmentPath({ parent: "enriched" });
                ifsSlot.if(`${enrichedAssignmentPath} == null`).appendBody(`${enrichedAssignmentPath} = ${defaultFunctionWithParameters.builder.toCallable()}`);

                return builder;
            }

            const defaultFunction = this.toNamedFunction(property.defaultValue.toString(), declarationsSlot);

            const ifsSlot = builder.get<SlotBlock>("factory.function.ifs");
            const enrichedAssignmentPath = property.getAssignmentPath({ parent: "enriched" });
            ifsSlot.if(`${enrichedAssignmentPath} == null`).appendBody(`${enrichedAssignmentPath} = ${defaultFunction.builder.toCallable()}`);

            return builder;
        }

        return super.handle(property, builder);
    }
}