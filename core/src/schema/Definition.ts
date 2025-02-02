import { CompiledSchema, GetHashTypeFunction, HashFunction, HashType, InferType, NonNullCreateEntity, NonNullEntity, SchemaTypes } from ".";
import { SchemaFunction } from './table/Function';
import { SchemaComputed } from './table/Computed';
import { SchemaBase } from "./property/base/Base";
import { createUUID, hash } from "../utilities";
import { IdType } from "../types";
import { PropertyInfo } from '../common/PropertyInfo';
import { Block, CodeBlock, ContainerBlock, ObjectBuilder, FunctionBuilder, Code } from '../common/CodeBlock';

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

    private _iterate(instance: SchemaBase<any, any>, callback: (property: PropertyInfo<any>) => void) {
        const explore: {
            path: string | null,
            instance: (SchemaBase<any, any> | { [key: string]: SchemaBase<any, any> }),
            parents: { schema: { [key: string]: SchemaBase<any, any> }, propertyInfo: PropertyInfo<any> }[],
            propertyInfo: PropertyInfo<any> | null

        }[] = [{ path: null, instance, parents: [], propertyInfo: null }];
        const properties: PropertyInfo<any>[] = [];

        for (let i = 0; i < explore.length; i++) {
            const item = explore[i];

            if (item.instance.type == SchemaTypes.Definition) {
                explore.push({ path: null, instance: item.instance.instance, parents: [], propertyInfo: null });
                continue;
            }

            const instance = item.instance as { [key: string]: SchemaBase<any, any> };
            for (const key in instance) {

                const property = instance[key] as SchemaBase<any, any>;
                const previousParent = item.parents.length == 0 ? null : item.parents[item.parents.length - 1].propertyInfo;

                if (property.type === SchemaTypes.Object) {

                    const propertyInfo = new PropertyInfo<any>(property, key, previousParent)
                    explore.push({
                        path: [item.path, key].filter(w => w != null).join("."),
                        instance: property.instance,
                        parents: [...item.parents, { schema: instance, propertyInfo: propertyInfo }],
                        propertyInfo
                    });

                    if (item.parents.length === 0) {
                        properties.push(propertyInfo);
                        continue;
                    }

                    previousParent.children.push(propertyInfo);
                    continue;
                }

                const childPrimitivePropertyInfo = new PropertyInfo<any>((item.instance as any)[key], key, previousParent)
                if (item.parents.length === 0) {
                    properties.push(childPrimitivePropertyInfo);
                    continue;
                }

                previousParent.children.push(childPrimitivePropertyInfo);
            }
        }

        for (let i = 0; i < properties.length; i++) {
            callback(properties[i]);
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

    private _toNamedFunction(stringifiedFunction: string, parent: ContainerBlock) {
        const name = createUUID()

        const functionBody = parent.function(name);

        if (stringifiedFunction.includes("=>")) {

            const split = stringifiedFunction.split("=>").map(w => w.trim());
            const parameters = split[0].replace(/\(|\)/g, "").split(",");
            const body = split[1];

            functionBody.parameters(...parameters);

            if (body.startsWith("{") === true) {

                functionBody.raw(stringifiedFunction);
                
                return;
            }

            functionBody.appendBody(`return ${body};`);
            return
        }

        throw new Error("Only arrow functions are allowed in the schema definition:  function () {}  --->  () => {}");
    }

    // private _appendCompare(property: PropertyInfo<any>, builder: { returnBody: string[], declarations: string[] }, path: string) {

    //     if (property.isUnmapped == true) {
    //         return;
    //     }

    //     if (property.isIdentity === true) {
    //         return;
    //     }

    //     if (property.valueSerializer != null) {
    //         const fn = this._toNamedFunction(property.valueSerializer.toString());

    //         builder.declarations.push(fn.body)
    //         builder.returnBody.push(`${path.replace("entity.", "a.")} == ${fn.name}(${path.replace("entity.", "b.")})`);
    //         return;
    //     }

    //     builder.returnBody.push(`${path.replace("entity.", "a.")} == ${path.replace("entity.", "b.")}`);
    // }

    // private _appendPrepare(property: PropertyInfo<any>, builder: FunctionBuilder<"return" | "functions" | "optionals">, value: string, selectorPath?: string) {

    //     if (property.isUnmapped === true) {
    //         return;
    //     }

    //     if (property.isIdentity === true && selectorPath != null) {
    //         // Optionally map for updates.  Identities need to be sent in for updates, but not for additions
    //         const path = property.getSelectrorPath("entity");
    //         const assignmentPath = property.getAssignmentPath("result");
    //         const optionalAssignment = `
    // if (${path} != null) {
    //     ${assignmentPath} = ${path};
    // }
    //         `;

    //         builder.append("optionals", optionalAssignment)
    //         return;
    //     }

    //     if (property.valueSerializer != null) {
    //         const fn = this._toNamedFunction(property.valueSerializer.toString());

    //         builder.append("functions", fn.body);
    //         builder.append("return", value.replace(selectorPath, `${fn.name}(${selectorPath})`));
    //         return;
    //     }

    //     builder.append("return", value);
    // }

    // private _appendDeserializer(property: PropertyInfo<any>, builder: FunctionBuilder<"return" | "variables">, value: string, selectorPath?: string) {

    //     if (property.isUnmapped == true) {
    //         return;
    //     }

    //     if (selectorPath == null) {
    //         builder.append("return", value);
    //         return;
    //     }

    //     if (property.valueDeserializer != null) {
    //         const fn = this._toNamedFunction(property.valueDeserializer.toString());

    //         builder.append("variables", fn.body);
    //         builder.append("return", value.replace(selectorPath, `${fn.name}(${selectorPath})`));
    //         return;
    //     }

    //     builder.append("return", value);
    // }

    // private _appendHashMapper(property: PropertyInfo<any>, builder: FunctionBuilder<"return-object" | "return-ids" | "functions">, selectorPath: string) {

    //     if (property.isKey) {
    //         builder.append("return-ids", `$\{${property.getSelectrorPath("entity")}\}`);
    //         return
    //     }

    //     if (property.isIdentity == true || property.type === SchemaTypes.Computed || property.type === SchemaTypes.Function) {
    //         return;
    //     }

    //     let optionalPath = selectorPath.split(/\.|\?\./g);

    //     if (property.type === SchemaTypes.Date) {
    //         const path = optionalPath.join("?.");

    //         optionalPath = [`stringifyDate(${path})`];
    //     }

    //     builder.append("return-object", `$\{${optionalPath.join("?.")}\}`);
    // }

    private _createIfAssignment(splitSelectorPath: string[], functionBody: string, parentName: string) {

        const parentPathParts: string[] = [parentName];
        for (let i = 0; i < splitSelectorPath.length; i++) {

            const item = splitSelectorPath[i];
            if (i === 0) {
                continue;
            }

            if (i >= splitSelectorPath.length - 1) {
                break;
            }

            parentPathParts.push(item);
        }

        const parentPath = parentPathParts.join("?.");
        const assignmentPath = [parentName, ...splitSelectorPath.slice(1, splitSelectorPath.length)].join(".")

        return `
    if (${parentPath} != null) {
        ${assignmentPath} = ${functionBody};
    }
    `
    }

    private _createIfConditionalPropertyAssignment(splitSelectorPath: string[], parentName: string) {

        const assignmentPath = [parentName, ...splitSelectorPath.slice(1, splitSelectorPath.length)].join(".")

        return `
    if (${splitSelectorPath.join("?.")} != null) {
        ${assignmentPath} = ${splitSelectorPath.join(".")};
    }
`

    }

    // private _appendMerge(property: PropertyInfo<any>, builder: FunctionBuilder<"assignments" | "functions" | "deserializers" | "post-ifs">, value: string, selectorPath: string) {

    //     const fullSplit = selectorPath.split(/\.|\?\./g)
    //     const split = [...fullSplit];

    //     split.splice(0, 1);

    //     if (property.valueDeserializer != null) {
    //         const fn = this._toNamedFunction(property.valueDeserializer.toString());
    //         const assignment = `
    //     if (${fullSplit.join("?.")} != null) {
    //         ${fullSplit.join(".")} = ${fn.name}(${fullSplit.join(".")});
    //     }
    //     `
    //         builder.append("functions", fn.body);
    //         builder.append("deserializers", assignment);
    //         return;
    //     }

    //     if (property.functionBody != null) {

    //         const parameterNames: string[] = ["destination", "tableName"];

    //         if (property.injected != null) {
    //             parameterNames.push(builder.inject(property.injected));
    //         }

    //         if (property.type === SchemaTypes.Computed) {
    //             const fn = this._toNamedFunction(property.functionBody.toString());
    //             const ifEnricher = this._createIfAssignment(fullSplit, `${fn.name}(${parameterNames.join(",")})`, "destination");

    //             builder.append("functions", fn.body);
    //             builder.append("post-ifs", ifEnricher);
    //             return;
    //         }

    //         // function
    //         const fn = this._toNamedFunction(property.functionBody.toString());
    //         const changedFunction = fn.build(`() => ${fn.returning}`)

    //         const ifEnricher = this._createIfAssignment(fullSplit, `${fn.name}(${parameterNames.join(",")})`, "destination");

    //         builder.append("functions", changedFunction);
    //         builder.append("post-ifs", ifEnricher);
    //         return
    //     }

    //     if ((property.isNullable === true || property.isOptional === true) && property.type !== SchemaTypes.Object) {
    //         const ifEnricher = this._createIfConditionalPropertyAssignment(fullSplit, "source");
    //         builder.append("assignments", ifEnricher);
    //         return;
    //     }

    //     if (property.type === SchemaTypes.Object) {
    //         // Create the object if it doesn't exist
    //         const destPath = ["destination", ...split].join(".");
    //         const sourcePath = ["source", ...split].join(".");

    //         const objectAssignment = `
    //     if (${sourcePath} != null) {
    //         if (${destPath} == null) {
    //             ${destPath} = {};
    //         }
    //         ${property.hasIdentityChildren ?
    //                 // For objects with identity children, we need to merge
    //                 `Object.assign(${destPath}, ${sourcePath});` :
    //                 // For regular objects, we can do a direct assignment
    //                 `${destPath} = ${sourcePath};`
    //             }
    //     }`
    //         builder.append("assignments", objectAssignment);
    //         return;
    //     }

    //     if (property.isKey === true || property.isIdentity === true) {
    //         const conditionalAssignment = `
    //     if (${["source", ...split].join("?.")} != null) {
    //         ${["destination", ...split].join(".")} = ${["source", ...split].join("?.")}
    //     }`
    //         builder.append("post-ifs", conditionalAssignment);
    //         return;
    //     }

    //     // For all other properties, do a direct assignment if source value exists
    //     const directAssignment = `
    //     if (${["source", ...split].join("?.")} != null) {
    //         ${["destination", ...split].join(".")} = ${["source", ...split].join("?.")}
    //     }`
    //     builder.append("assignments", directAssignment);
    // }

//     private _appendEnricher(property: PropertyInfo<any>, builder: FunctionBuilder<"variables" | "enrichments" | "functions" | "entity" | "change-tracking">, value: string, selectorPath: string) {

//         const split = selectorPath.split(/\.|\?\./g);

//         if (property.functionBody != null) {

//             const parameterNames: string[] = ["enriched", "tableName"];

//             if (property.injected != null) {
//                 parameterNames.push(builder.inject(property.injected));
//             }

//             if (property.type === SchemaTypes.Computed) {
//                 const fn = this._toNamedFunction(property.functionBody.toString());
//                 const ifEnricher = this._createIfAssignment(split, `${fn.name}(${parameterNames.join(",")})`, "enriched");

//                 builder.append("functions", fn.body);
//                 builder.append("enrichments", ifEnricher);
//                 return;
//             }

//             // function
//             const fn = this._toNamedFunction(property.functionBody.toString());
//             const changedFunction = fn.build(`() => ${fn.returning}`)
//             const ifEnricher = this._createIfAssignment(split, `${fn.name}(${parameterNames.join(",")})`, "enriched");

//             builder.append("functions", changedFunction);
//             builder.append("enrichments", ifEnricher);
//             return
//         }

//         if (property.defaultValue != null) {

//             if (typeof property.defaultValue === "function") {
//                 const fn = this._toNamedFunction(property.defaultValue.toString());
//                 builder.append("functions", fn.body);

//                 const parameterNames: string[] = [];

//                 if (property.injected != null) {
//                     parameterNames.push(builder.inject(property.injected));
//                 }

//                 if (property.parent == null) {
//                     debugger;
//                     builder.append("entity", `${property.name}: ${selectorPath.split(".").join("?.")} ?? ${fn.name}(${parameterNames.join(",")}),`);
//                     return;
//                 }

//                 debugger;
//                 builder.append("entity", `${selectorPath.split(".").join("?.")} ?? ${fn.name}(${parameterNames.join(",")})`);
//                 return;
//             }

//             if (property.parent == null) {
//                 debugger;
//                 builder.append("entity", `${property.name}: ${selectorPath.split(".").join("?.")} ?? ${this._toJson(property.defaultValue)}`);
//                 return;
//             }
//             // DO THIS
//             return;
//         }

//         if (property.isIdentity === true) {

//             if (property.type === SchemaTypes.Object) {
//                 debugger;
//                 // For object identity properties, we need to create the object if it doesn't exist
//                 const destPath = ["enriched", ...split.slice(1, split.length)].join(".");
//                 const sourcePath = split.join("?.");

//                 const objectAssignment = `
//     if (${sourcePath} != null) {
//         if (${destPath} == null) {
//             ${destPath} = {};
//         }
//         Object.assign(${destPath}, ${sourcePath});
//     }`;

//                 builder.append("enrichments", objectAssignment);
//                 return;
//             }

//             // For primitive identity properties
//             const ifEnricher = this._createIfConditionalPropertyAssignment(split, "enriched");
//             builder.append("enrichments", ifEnricher);
//             return;
//         }

//         if (property.type === SchemaTypes.Object) {
//             const changedPath = ["enriched", ...split.slice(1, split.length)].join(".");
//             const enableChangeTracking = `
// ${changedPath} = enableChangeTracking(${changedPath}, "${property.getAssignmentPath()}", enriched);`
//             builder.unshift("change-tracking", enableChangeTracking);
//             return;
//         }

//         if (property.parent != null && property.parent.isIdentity === true) {
//             return;
//         }

//         builder.append("entity", value);
//     }

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

    private _buildEnricher(property: PropertyInfo<any>, builder: Code) {
        debugger;
        const selectorPath = property.getSelectrorPath("entity", { forceNullableOrOptional: true });

        if (property.isIdentity === true) {

            if (property.type === SchemaTypes.Object) {

                return;
            }
            const section = builder.getOrCreateBlock(2);
            const entitySelectorPath = property.getAssignmentPath("entity");
            const enrichedAssignmentPath = property.getAssignmentPath("enriched");
            section.if(`${selectorPath} != null`).appendBody(`${enrichedAssignmentPath} = ${entitySelectorPath}`);

            return;
        }

        if (property.defaultValue != null) {

            if (typeof property.defaultValue === "function") {
                debugger;
                const section = builder.getBlock(1);
                this._toNamedFunction(property.defaultValue.toString(), section);

                // example: () => 1
                // should be: const someName = () => 1;
            }
        }

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

        const enricher = new Code<"functions" | "body">({ functions: 1, body: 2 });
        const functions = enricher.getOrCreateBlock("functions");
        const body = enricher.getOrCreateBlock("body");

        const enricherFunctionBody = functions.function().parameters("entity")
        enricherFunctionBody.raw(this.createChangeTracker.toString());
        body.variable("enableChangeTracking").value("createChangeTracker()");

        // Build stringifier
        const stringifier = new CodeBlock();
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
            this._buildEnricher(property, enricher);
        });

        console.log("enricher");
        console.log(enricher.toString());
        console.log("enricher");

        // const idSelectorFunction = Function("entity", `return [${idPropertyNames.map(w => `entity.${w}`).join(",")}];`) as (entity: NonNullEntity<T>) => [IdType];
        // const toHash = Function("entity", "type", hashFunctionBody) as HashFunction<T>;
        // const getHashType = Function("entity", "") as GetHashTypeFunction<T>;

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
            enrich: null as any,
            tableName: this.tableName,
            hasIdentityKeys
        }
    }
}
