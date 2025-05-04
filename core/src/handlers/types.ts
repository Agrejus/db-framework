import { AssignmentBuilder, CodeBuilder, ContainerBlock, Insert, ObjectBuilder, SlotBlock } from '../common/CodeBlock';
import { PropertyInfo } from '../common/PropertyInfo';
import { SlotPath } from '../common/SlotPath';
import { SchemaError } from '../errors/SchemaError';
import { uuid } from '../utilities/uuid';

export interface IHandler {
    setNext(handler: IHandler): IHandler;

    handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null;
}

export abstract class PropertyInfoHandler implements IHandler {

    private _next: IHandler | null;

    setNext(handler: IHandler): IHandler {
        this._next = handler;

        return handler;
    }

    handle(property: PropertyInfo<any>, builder: CodeBuilder): CodeBuilder | null {
        try {
            if (this._next) {
                return this._next.handle(property, builder);
            }

            return null;
        } catch (e: any) {
            throw new SchemaError(e, `Error handling property: ${property.name}`);
        }
    }

    protected buildSlotPath(property: PropertyInfo<any>, path: SlotPath) {

        const result = new SlotPath(...path.path);
        const items: string[] = []
        let p = property;

        while (p.parent != null) {
            items.unshift(p.name);
            p = p.parent;
        }

        items.unshift(p.name);

        result.push(...items);

        return result
    }

    protected setEnrichedProperty(property: PropertyInfo<any>, root: CodeBuilder) {
        const entitySelectorPath = property.getAssignmentPath({ parent: "entity" });

        if (property.parent != null) {
            const slotPath = new SlotPath("factory", "function", "assignment");
            const path = property.parent.getAssignmentPath({ parent: "enriched" });
            slotPath.push(`[${path}]`)
            const builder = root.get<AssignmentBuilder>(slotPath.get());
            const objectBuilder = builder.getValue as ObjectBuilder;

            const childEntityPathSelector = property.getSelectrorPath({ parent: "entity" });
            objectBuilder.property(`${property.name}: ${childEntityPathSelector}`);
            return;
        }

        const slotPath = new SlotPath("factory", "function", "enriched", "object", "enriched");
        let enriched = root.getOrDefault<ObjectBuilder>(slotPath.get());

        if (enriched == null) {
            const enrichedSlot = root.get<SlotBlock>("factory.function.enriched");
            enriched = enrichedSlot.variable("enriched", { name: "object" }).object({ name: "enriched" });
        }

        enriched.property(`${property.name}: ${entitySelectorPath}`);
    }

    protected toNamedFunction(stringifiedFunction: string, parent: ContainerBlock) {
        const name = uuid()

        const builder = parent.function(name);

        if (stringifiedFunction.includes("=>")) {

            const split = stringifiedFunction.split("=>").map(w => w.trim());
            const parameters = split[0].replace(/\(|\)/g, "").split(",");
            const body = split[1];

            if (body.startsWith("{") === true) {

                builder.raw(stringifiedFunction);

                return {
                    builder,
                    parameters
                };
            }

            builder.appendBody(`return ${body};`);
            return {
                builder,
                parameters
            }
        }

        throw new Error("Only arrow functions are allowed in the schema definition:  function () {}  --->  () => {}");
    }
}