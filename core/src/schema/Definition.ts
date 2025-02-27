import { CompiledSchema, GetHashTypeFunction, HashFunction, HashType, InferType, NonNullCreateEntity, NonNullEntity, SchemaTypes } from ".";
import { SchemaFunction } from './table/Function';
import { SchemaComputed } from './table/Computed';
import { SchemaBase } from "./property/base/Base";
import { createUUID, hash } from "../utilities";
import { IdType } from "../types";
import { PropertyInfo } from '../common/PropertyInfo';
import { Block, CodeBuilder, ContainerBlock, ObjectBuilder, FunctionBuilder, Insert, FunctionFactoryBuilder, SlotBlock, AssignmentBuilder } from '../common/CodeBlock';
import { SlotPath } from '../common/SlotPath';
import { EnrichmentHandlerBuilder } from '../handlers/EnrichmentHandlerBuilder';

export class SchemaDefinition<T extends {}> extends SchemaBase<T, any> {

    instance: T;
    type = SchemaTypes.Definition;
    tableName: string;

    constructor(tableName: string, schema: T) {
        super();
        this.tableName = tableName;
        this.instance = schema;
        this.isNullable = false;
        this.isOptional = false;
    }

    modify<R>(builder: (d: {
        function: <UU, I = never>(fn: (entity: InferType<SchemaDefinition<T>>, tableName: string, injected: I) => UU, injected?: I) => SchemaFunction<UU, I, "unmapped">;
        computed: <UU, I = never>(fn: (entity: InferType<SchemaDefinition<T>>, tableName: string, injected: I) => UU, injected?: I) => SchemaComputed<UU, I, "unmapped">;
    }) => R) {

        const b = {
            function: <UU, I = never>(fn: (entity: InferType<SchemaDefinition<T>>, tableName: string, injected: I) => UU, injected?: I) => new SchemaFunction<UU, I, "unmapped">(fn as any, injected, this.instance as any),
            computed: <UU, I = never>(fn: (entity: InferType<SchemaDefinition<T>>, tableName: string, injected: I) => UU, injected?: I) => new SchemaComputed<UU, I, "unmapped">(fn as any, injected, this.instance as any)
        }

        const r = builder(b)

        return new SchemaDefinition<R & T>(this.tableName, { ...this.instance, ...r });
    }

    onAfterSave(callback: (entity: InferType<T>) => void) {

        return this;
    }

    private _iterate(
        instance: SchemaBase<any, any>,
        callback: (property: PropertyInfo<any>) => void
    ) {
        const explore: {
            path: string | null;
            instance:
            | SchemaBase<any, any>
            | { [key: string]: SchemaBase<any, any> };
            parents: {
                schema: { [key: string]: SchemaBase<any, any> };
                propertyInfo: PropertyInfo<any>;
            }[];
            propertyInfo: PropertyInfo<any> | null;
        }[] = [
                { path: null, instance, parents: [], propertyInfo: null }
            ];
        const properties: PropertyInfo<any>[] = [];

        for (let i = 0; i < explore.length; i++) {
            const item = explore[i];

            if (item.instance.type === SchemaTypes.Definition) {
                explore.push({
                    path: null,
                    instance: item.instance.instance,
                    parents: [],
                    propertyInfo: null
                });
                continue;
            }

            const instanceObj = item.instance as {
                [key: string]: SchemaBase<any, any>;
            };
            for (const key in instanceObj) {
                const propertyInstance = instanceObj[key] as SchemaBase<any, any>;
                const previousParent =
                    item.parents.length === 0
                        ? null
                        : item.parents[item.parents.length - 1].propertyInfo;

                if (propertyInstance.type === SchemaTypes.Object) {
                    const propertyInfo = new PropertyInfo<any>(
                        propertyInstance,
                        key,
                        previousParent
                    );
                    explore.push({
                        path: [item.path, key].filter((w) => w != null).join("."),
                        instance: propertyInstance.instance,
                        parents: [
                            ...item.parents,
                            { schema: instanceObj, propertyInfo: propertyInfo }
                        ],
                        propertyInfo
                    });

                    if (previousParent === null) {
                        properties.push(propertyInfo);
                        continue;
                    }

                    previousParent.children.push(propertyInfo);
                    continue;
                }

                const childPrimitivePropertyInfo = new PropertyInfo<any>(
                    (item.instance as any)[key],
                    key,
                    previousParent
                );
                if (previousParent === null) {
                    properties.push(childPrimitivePropertyInfo);
                    continue;
                }

                previousParent.children.push(childPrimitivePropertyInfo);
            }
        }

        // Recursively trigger callbacks on properties and their children
        function recursiveCallback(prop: PropertyInfo<any>) {
            callback(prop);
            for (const child of prop.children) {
                recursiveCallback(child);
            }
        }

        for (const prop of properties) {
            recursiveCallback(prop);
        }
    }

    private _toJson(value: string | number | Date) {
        if (typeof value === "string") {
            return `"${value}"`;
        }

        if (typeof value === "object" && "toISOString" in value) {
            return `new Date("${value.toISOString()}")`;
        }

        return value;
    }

    private _appendCloner(property: PropertyInfo<any>, builder: string[], value: string) {
        builder.push(value);
    }

    private _appendStripper(property: PropertyInfo<any>, builder: string[], value: string) {
        if (property.isUnmapped == true) {
            return;
        }

        if (property.isIdentity === true) {
            return;
        }

        builder.push(value);
    }

    private _toNamedFunction(stringifiedFunction: string, parent: ContainerBlock, insert?: Insert) {
        const name = createUUID()

        const builder = parent.function(name, { insert });

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

    private createChangeTracker() {

        const DIRTY_ENTITY_MARKER: string = "isDirty";
        const CHANGES_ENTITY_KEY: string = "changes";
        const ORIGINAL_ENTITY_KEY: string = "original";
        const PAUSED_ENTITY_KEY: string = "isPaused";
        const TRACKING_KEY: string = "__tracking__";
        const PROXY_MARKER: string = "__isProxy__";

        return <TEntity extends {}>(entity: TEntity, path?: string, parent?: TEntity) => {

            const proxyHandler: ProxyHandler<TEntity> = {
                set: (entity, property, value) => {
                    const indexableEntity: { [key: string]: any } = entity;
                    const key = String(property);
                    const originalValue = indexableEntity[key];

                    // if values are the same, do nothing
                    if (originalValue === value) {
                        return true;
                    }

                    const resolvedParent: { [key: string]: any } = parent ?? entity;

                    if (resolvedParent[TRACKING_KEY] == null) {
                        resolvedParent[TRACKING_KEY] = {
                            [CHANGES_ENTITY_KEY]: {},
                            [DIRTY_ENTITY_MARKER]: false,
                            [ORIGINAL_ENTITY_KEY]: {},
                            [PAUSED_ENTITY_KEY]: false
                        }
                    }

                    if (key == TRACKING_KEY) {
                        return true;
                    }

                    if (resolvedParent[TRACKING_KEY] != null && resolvedParent[TRACKING_KEY][PAUSED_ENTITY_KEY] === true) {
                        Reflect.set(indexableEntity, property, value);
                        return true;
                    }

                    const resolvedPath = path == null ? key : `${path}.${key}`;
                    const changes = resolvedParent[TRACKING_KEY];

                    if (changes[CHANGES_ENTITY_KEY][resolvedPath] != null) {

                        if (changes[ORIGINAL_ENTITY_KEY][resolvedPath] === value) {
                            // we are changing the value back to the original value, remove the change
                            delete changes[ORIGINAL_ENTITY_KEY][resolvedPath];
                            delete changes[CHANGES_ENTITY_KEY][resolvedPath];
                        } else {
                            // track the change
                            changes[CHANGES_ENTITY_KEY][resolvedPath] = value;
                        }

                    } else if (changes[CHANGES_ENTITY_KEY][resolvedPath] == null) {
                        // don't keep updating, keep the original value
                        changes[CHANGES_ENTITY_KEY][resolvedPath] = value;
                        changes[ORIGINAL_ENTITY_KEY][resolvedPath] = originalValue;
                    }

                    const isDirty = Object.keys(changes[ORIGINAL_ENTITY_KEY]).length > 0;
                    changes[DIRTY_ENTITY_MARKER] = isDirty;

                    Reflect.set(indexableEntity, property, value);

                    return true;
                },
                get: (target, property, receiver) => {

                    if (property === PROXY_MARKER) {
                        return true;
                    }

                    return Reflect.get(target, property, receiver);
                }
            }

            return new Proxy(entity, proxyHandler) as TEntity
        }
    }

    private _setEnrichedProperty(property: PropertyInfo<any>, root: CodeBuilder) {
        const entitySelectorPath = property.getAssignmentPath("entity");

        if (property.parent != null) {
            const slotPath = new SlotPath("factory", "function", "assignment");
            const path = property.parent.getAssignmentPath("enriched");
            slotPath.push(`[${path}]`)
            const builder = root.get<AssignmentBuilder>(slotPath.get());
            const objectBuilder = builder.getValue as ObjectBuilder;

            const childEntityPathSelector = property.getSelectrorPath("entity");
            objectBuilder.property(`${property.name}: ${childEntityPathSelector}`);
            return;
        }

        const slotPath = new SlotPath("factory", "function", "enriched", "object", "enriched");
        let enriched = root.get<ObjectBuilder>(slotPath.get());

        if (enriched == null) {
            const enrichedSlot = root.get<SlotBlock>("factory.function.enriched");
            enriched = enrichedSlot.variable("enriched", { name: "object" }).object({ name: "enriched" });
        }

        enriched.property(`${property.name}: ${entitySelectorPath}`);
    }

    private _buildSlotPath(property: PropertyInfo<any>, path: SlotPath) {

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

    private _buildEnricher(property: PropertyInfo<any>, root: CodeBuilder) {

        const selectorPath = property.getSelectrorPath("entity", { forceNullableOrOptional: true });

        if (property.isIdentity === true) {

            if (property.type === SchemaTypes.Object) {
                return;
            }

            const slot = root.get<SlotBlock>("factory.function.ifs");
            const entitySelectorPath = property.getAssignmentPath("entity");
            const enrichedAssignmentPath = property.getAssignmentPath("enriched");
            slot.if(`${selectorPath} != null`).appendBody(`${enrichedAssignmentPath} = ${entitySelectorPath}`);

            return;
        }

        // Handle nested objects recursively using PropertyInfo children
        if (property.type === SchemaTypes.Object) {

            const slotPath = new SlotPath("factory", "function", "enriched", "object", "enriched");
            const nestedSlotPath = this._buildSlotPath(property, slotPath);

            // Generate null check for current level using parent relationships
            const entityPath = property.getSelectrorPath("entity", { forceNullableOrOptional: true });
            const enrichedPath = property.getAssignmentPath("enriched");

            if (property.isNullable || property.isOptional) {
                const ifsSlot = root.get<SlotBlock>("factory.function.ifs");
                ifsSlot.if(`${entityPath} != null`).appendBody(`${enrichedPath} = enableChangeTracking(${enrichedPath} || {}, "${property.name}");`);

                let enriched = root.get<ObjectBuilder>(nestedSlotPath.get());

                if (enriched == null) {
                    const enrichedSlot = root.get<ObjectBuilder>(slotPath.get());
                    enriched = enrichedSlot.nested(property.name, property.name);
                }
                return;
            }

            const assignmentSlot = root.get<SlotBlock>("factory.function.assignment");
            const childPath = property.getAssignmentPath("enriched");
            assignmentSlot.assign(childPath, { name: `[${childPath}]` }).call("enableChangeTracking", { name: "builder" });

            // for (const child of property.children) {
            //     const childEntityPathSelector = child.getSelectrorPath("entity");
            //     objectBuilder.property(`${child.name}: ${childEntityPathSelector}`)
            // }
            return;
        }

        if (property.defaultValue != null) {

            this._setEnrichedProperty(property, root);

            // only thing we can inject for defaults is an injected object
            if (typeof property.defaultValue === "function") {
                // we need to add the call for this function too, want to create an if
                const declarationsSlot = root.get<SlotBlock>("factory.function.declarations");

                if (property.injected != null) {

                    const factory = root.get<FunctionFactoryBuilder>("factory");
                    const parameter = factory.createParameter(property.injected);
                    factory.parameters(parameter);

                    const defaultFunctionWithParameters = this._toNamedFunction(property.defaultValue.toString(), declarationsSlot);
                    // This is ok, defaults can only inject one parameter anyways
                    defaultFunctionWithParameters.builder.parameters(...defaultFunctionWithParameters.parameters.map(w => ({ name: w, callName: parameter.name })));


                    const ifsSlot = root.get<SlotBlock>("factory.function.ifs");
                    const enrichedAssignmentPath = property.getAssignmentPath("enriched");
                    ifsSlot.if(`${enrichedAssignmentPath} == null`).appendBody(`${enrichedAssignmentPath} = ${defaultFunctionWithParameters.builder.toCallable()}`);

                    return;
                }

                const defaultFunction = this._toNamedFunction(property.defaultValue.toString(), declarationsSlot);

                const ifsSlot = root.get<SlotBlock>("factory.function.ifs");
                const enrichedAssignmentPath = property.getAssignmentPath("enriched");
                ifsSlot.if(`${enrichedAssignmentPath} == null`).appendBody(`${enrichedAssignmentPath} = ${defaultFunction.builder.toCallable()}`);

                return;
            }

            return;
        }

        if (property.functionBody != null) {

            const parameterNames: string[] = ["enriched", "tableName"];

            if (property.injected != null) {

                const factory = root.get<FunctionFactoryBuilder>("factory");
                const parameter = factory.createParameter(property.injected);
                factory.parameters(parameter);

                parameterNames.push(parameter.name);
            }

            if (property.type === SchemaTypes.Computed) {
                const declarationsSlot = root.get<SlotBlock>("factory.function.declarations");
                const defaultFunctionWithParameters = this._toNamedFunction(property.functionBody.toString(), declarationsSlot);

                defaultFunctionWithParameters.builder.parameters(...parameterNames.map((w, i) => ({ name: defaultFunctionWithParameters.parameters[i], callName: w })));


                const ifsSlot = root.get<SlotBlock>("factory.function.ifs");
                const enrichedAssignmentPath = property.getAssignmentPath("enriched");
                ifsSlot.if(`${enrichedAssignmentPath} == null`).appendBody(`${enrichedAssignmentPath} = ${defaultFunctionWithParameters.builder.toCallable()}`);
                return;
            }

            return;
        }

        this._setEnrichedProperty(property, root);
    }

    private _processStringifier(property: PropertyInfo<any>, objectBuilder: ObjectBuilder) {
        const selectorPath = property.getSelectrorPath("entity");

        // Handle arrays
        if (property.type === SchemaTypes.Array) {
            debugger;
            const arrayItemSchema = (property as any).itemSchema;

            // if (arrayItemSchema.type === SchemaTypes.Object) {
            //     const nestedBuilder = objectBuilder.nested(property.name);
            //     nestedBuilder.property(
            //         `${selectorPath}?.map(item => ({${
            //             arrayItemSchema.children.map(child => 
            //                 `${child.name}: item.${child.name}`
            //             ).join(",")
            //         }))`
            //     );
            //     return;
            // }

            if (arrayItemSchema.type === SchemaTypes.Date) {
                objectBuilder.property(
                    `${property.name}: ${selectorPath}?.map(item => item.toISOString())`
                );
                return;
            }

            objectBuilder.property(
                `${property.name}: ${selectorPath}`
            );
            return;
        }

        // Handle objects
        if (property.type === SchemaTypes.Object) {
            const nestedBuilder = objectBuilder.nested(property.name);

            // Process each child property
            property.children.forEach(child => {
                this._processStringifier(child, nestedBuilder);
            });
            return;
        }

        // Handle dates
        if (property.type === SchemaTypes.Date) {
            objectBuilder.property(
                `${property.name}: ${selectorPath}?.toISOString()`
            );
            return;
        }

        // Handle primitives
        objectBuilder.property(`${property.name}: ${selectorPath}`);
    }

    compile(): CompiledSchema<T> {

        const schema = this;
        const properties: PropertyInfo<T>[] = [];

        const enrichmentHandlerBuilder = new EnrichmentHandlerBuilder();
        const enricher = enrichmentHandlerBuilder.build();
        const enricherCodeBuilder = new CodeBuilder();
        const enricherFunctionRoot = enricherCodeBuilder.factory("factory", { name: "factory" }).parameters({ name: "tableName", value: this.tableName });
        const enricherFunctionBody = enricherFunctionRoot.function(undefined, { name: "function" }).parameters("entity").return();

        enricherFunctionBody.raw(`function ${this.createChangeTracker.toString()}`);
        enricherFunctionBody.variable("enableChangeTracking").value("createChangeTracker()");

        enricherFunctionBody.slot("enriched");
        enricherFunctionBody.slot("declarations");
        enricherFunctionBody.slot("ifs");
        enricherFunctionBody.slot("assignment");
        enricherFunctionBody.raw('\treturn enableChangeTracking(enriched);');

        // const enricherFunctionBody = enricher.function().parameters("entity")
        // enricherFunctionBody.raw(this.createChangeTracker.toString());
        // const mainName = enricherFunctionBody.variable("enableChangeTracking").value("createChangeTracker()").name;

        // Build stringifier
        const stringifier = new CodeBuilder();
        const returnObject = stringifier.object();

        //     function stringifyDate(d) {

        //         if (typeof d === "string") {
        //             return d;
        //         }

        //         if ("toISOString" in d) {
        //             return d.toISOString();
        //         }

        //         return d.toString();
        //     }`);

        //         mergeFunciton.append("functions", `
        //     function pause() {
        //         // initiate change tracking if needed
        //         if (destination.__tracking__ == null) {
        //             destination.__tracking__ = {};
        //         }

        //         destination.__tracking__.isPaused = true;
        //     }    

        //     function unpause() {
        //         destination.__tracking__.isPaused  = false;
        //     }    
        // `)

        // Call _iterate to process the schema and build the function body
        const idPropertyNames: string[] = [];
        const allPropertyNamesAndPaths: string[] = [];
        let hashType: HashType = HashType.Ids;
        let hasIdentities = false;
        let hasIdentityKeys = false;

        this._iterate(schema, (property) => {

            properties.push(property);
            allPropertyNamesAndPaths.push(property.getSelectrorPath("entity"));

            // Check if the property or any parent is nullable/optional
            const isParentNullableOrOptional = property.hasNullableParents;
            const isPropertyNullableOrOptional = property.isNullable || property.isOptional || isParentNullableOrOptional;

            // Construct the selector path with or without null-safe operators
            const selectorPath = property.getSelectrorPath("entity");
            const name = property.name;

            if (property.isIdentity === true) {
                hasIdentities = true;
            }

            if (property.isKey === true) {
                idPropertyNames.push(property.name);
            }

            if (property.isKey === true && property.isIdentity === true) {
                hasIdentityKeys = true;
            }

            this._processStringifier(property, returnObject);
            enricher.handle(property, enricherCodeBuilder)
        });

        const params = enricherFunctionRoot.getParameters()
        const enrichGenerator = Function(`return ${enricher.toString()}`);
        const enricherFactoryFunction = enrichGenerator();
        // const idSelectorFunction = Function("entity", `return [${idPropertyNames.map(w => `entity.${w}`).join(",")}];`) as (entity: NonNullEntity<T>) => [IdType];
        // const toHash = Function("entity", "type", hashFunctionBody) as HashFunction<T>;
        // const getHashType = Function("entity", "") as GetHashTypeFunction<T>;
        const enricherFunction = enricherFactoryFunction(...params.map(w => w.value));

        console.log(enricher.toString());

        return {
            getId: null as any,
            properties,
            idPropertyNames,
            hasIdentities,
            hashType,
            getHashType: null as any,
            merge: null as any,
            prepare: null as any,
            clone: null as any,
            deserialize: null as any,
            compare: null as any,
            strip: null as any,
            hash: null as any,
            key: hash([...allPropertyNamesAndPaths, this.tableName].join(",")),
            getIds: null as any,
            enrich: enricherFunction,
            tableName: this.tableName,
            hasIdentityKeys
        }
    }
}
