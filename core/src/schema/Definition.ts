import { CompiledSchema, GetHashTypeFunction, HashFunction, HashType, InferType, NonNullCreateEntity, NonNullEntity, SchemaTypes } from ".";
import { SchemaFunction } from './table/Function';
import { SchemaComputed } from './table/Computed';
import { SchemaBase } from "./property/base/Base";
import { createUUID, hash } from "../utilities";
import { FunctionBuilder } from '../common/FunctionBuilder';
import { IdType } from "../types";
import { PropertyInfo } from '../common/PropertyInfo';

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
        function: <UU>(fn: (entity: InferType<SchemaDefinition<T>>, tableName: string) => UU) => SchemaFunction<UU, "unmapped">;
        computed: <UU>(fn: (entity: InferType<SchemaDefinition<T>>, tableName: string) => UU) => SchemaComputed<UU, "unmapped">;
    }) => R) {

        const b = {
            function: <UU>(fn: (entity: InferType<SchemaDefinition<T>>, tableName: string) => UU) => new SchemaFunction<UU, "unmapped">(fn as any, this.instance as any),
            computed: <UU>(fn: (entity: InferType<SchemaDefinition<T>>, tableName: string) => UU) => new SchemaComputed<UU, "unmapped">(fn as any, this.instance as any)
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

    private _resolvePropertyValue(pathSelector: string, property: PropertyInfo<any>) {

        if (property.defaultValue != null) {

            if (typeof property.defaultValue === "function") {
                const value = property.defaultValue();
                return `${pathSelector.split(".").join("?.")} ?? ${this._toJson(value)}`;
            }

            return `${pathSelector.split(".").join("?.")} ?? ${this._toJson(property.defaultValue)}`;
        }

        if (property.type === SchemaTypes.Computed || property.type === SchemaTypes.Function) {
            return "null";  // we need to replace this later, the entire entity needs to be loaded first so we have all the values for the function
        }

        return pathSelector;
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

    private _toNamedFunction(stringifiedFunction: string) {
        const name = createUUID()

        if (stringifiedFunction.includes("=>")) {

            const split = stringifiedFunction.split("=>").map(w => w.trim());
            const body = split[1];

            if (body.startsWith("{") === true) {

                // arrow function has a return keyword
                const fn = `
    const ${name} = ${stringifiedFunction}`
                const parameters = split[0].replace(/\(|\)/g, "").split(",");
                const build = (returningStatement: string) => fn.toString();

                return {
                    parameterNames: parameters,
                    name,
                    body: fn,
                    build,
                    returning: fn,
                }
            }

            const parameters = split[0].replace(/\(|\)/g, "").split(",");
            const build = (returningStatement: string) => {
                return `
    function ${name}(${parameters.join(",")}) {
        return ${returningStatement};
    }`
            }

            return {
                parameterNames: parameters,
                name,
                body: build(body),
                build,
                returning: body,
            }
        }

        if (stringifiedFunction.startsWith("function")) {
            const split = stringifiedFunction.split(/\(|\)/g);
            const functionBodyWithBraces = stringifiedFunction.replace(/function.{0,}\(.{1,}?\)/, "");
            const parameters = split[1].split(",");
            const build = (returningStatement: string) => {
                return `
    function ${name}(${parameters.join(",")}) {
        return ${returningStatement}
    }`
            }
            const returning = functionBodyWithBraces.trim().slice(1, functionBodyWithBraces.length - 2).trim();
            const correctedReturn = returning.replace("return", "").trim();

            return {
                parameterNames: parameters,
                name,
                body: build(correctedReturn),
                returning: correctedReturn,
                build
            }
        }

        throw new Error("Not a valid funciton");
    }

    private _appendCompare(property: PropertyInfo<any>, builder: { returnBody: string[], declarations: string[] }, path: string) {
        
        if (property.isUnmapped == true) {
            return;
        }

        if (property.isIdentity === true) {
            return;
        }

        if (property.valueSerializer != null) {
            const fn = this._toNamedFunction(property.valueSerializer.toString());

            builder.declarations.push(fn.body)
            builder.returnBody.push(`${path.replace("entity.", "a.")} == ${fn.name}(${path.replace("entity.", "b.")})`);
            return;
        }

        builder.returnBody.push(`${path.replace("entity.", "a.")} == ${path.replace("entity.", "b.")}`);
    }

    private _appendPrepare(property: PropertyInfo<any>, builder: FunctionBuilder<"return" | "functions" | "optionals">, value: string, selectorPath?: string) {

        if (property.isUnmapped === true) {
            return;
        }

        if (property.isIdentity === true && selectorPath != null) {
            // Optionally map for updates.  Identities need to be sent in for updates, but not for additions
            const path = property.getSelectrorPath("entity");
            const assignmentPath = property.getAssignmentPath("result");
            const optionalAssignment = `
    if (${path} != null) {
        ${assignmentPath} = ${path};
    }
            `;

            builder.append("optionals", optionalAssignment)
            return;
        }

        if (property.valueSerializer != null) {
            const fn = this._toNamedFunction(property.valueSerializer.toString());

            builder.append("functions", fn.body);
            builder.append("return", value.replace(selectorPath, `${fn.name}(${selectorPath})`));
            return;
        }

        builder.append("return", value);
    }

    private _appendDeserializer(property: PropertyInfo<any>, builder: FunctionBuilder<"return" | "variables">, value: string, selectorPath?: string) {

        if (property.isUnmapped == true) {
            return;
        }

        if (selectorPath == null) {
            builder.append("return", value);
            return;
        }

        if (property.valueDeserializer != null) {
            const fn = this._toNamedFunction(property.valueDeserializer.toString());

            builder.append("variables", fn.body);
            builder.append("return", value.replace(selectorPath, `${fn.name}(${selectorPath})`));
            return;
        }

        builder.append("return", value);
    }

    private _appendHashMapper(property: PropertyInfo<any>, builder: FunctionBuilder<"return-object" | "return-ids" | "functions">, selectorPath: string) {

        if (property.isKey) {
            builder.append("return-ids", `$\{${property.getSelectrorPath("entity")}\}`);
            return
        }

        if (property.isIdentity == true || property.type === SchemaTypes.Computed || property.type === SchemaTypes.Function) {
            return;
        }

        let optionalPath = selectorPath.split(/\.|\?\./g);

        if (property.type === SchemaTypes.Date) {
            const path = optionalPath.join("?.");

            optionalPath = [`stringifyDate(${path})`];
        }

        builder.append("return-object", `$\{${optionalPath.join("?.")}\}`);
    }

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

    private _appendMerge(property: PropertyInfo<any>, builder: FunctionBuilder<"assignments" | "functions" | "deserializers" | "post-ifs">, value: string, selectorPath: string) {

        const fullSplit = selectorPath.split(/\.|\?\./g)
        const split = [...fullSplit];

        split.splice(0, 1);

        if (property.valueDeserializer != null) {
            const fn = this._toNamedFunction(property.valueDeserializer.toString());
            const assignment = `
    if (${fullSplit.join("?.")} != null) {
        ${fullSplit.join(".")} = ${fn.name}(${fullSplit.join(".")});
    }
    `
            builder.append("functions", fn.body);
            builder.append("deserializers", assignment);
            return;
        }

        if (property.functionBody != null) {

            if (property.type === SchemaTypes.Computed) {
                const fn = this._toNamedFunction(property.functionBody.toString());
                const ifEnricher = this._createIfAssignment(fullSplit, `${fn.name}(destination, tableName)`, "destination");

                builder.append("functions", fn.body);
                builder.append("post-ifs", ifEnricher);
                return;
            }

            // function
            const fn = this._toNamedFunction(property.functionBody.toString());
            const changedFunction = fn.build(`() => ${fn.returning}`)

            const ifEnricher = this._createIfAssignment(fullSplit, `${fn.name}(destination, tableName)`, "destination");

            builder.append("functions", changedFunction);
            builder.append("post-ifs", ifEnricher);
            return
        }

        if (property.isNullable === true || property.isOptional === true) {

            const ifEnricher = this._createIfConditionalPropertyAssignment(fullSplit, "source");

            builder.append("assignments", ifEnricher);

            return;
        }

        if (property.type === SchemaTypes.Object && property.hasIdentityChildren === true) {
            // needs love
            builder.append("assignments", `${["destination", ...split].join(".")} = {}`);
            return;
        }

        if (property.isKey === true || property.isIdentity === true) {
            const conditionalAssignment = `
    if (${["source", ...split].join("?.")} != null) {
        ${["destination", ...split].join(".")} = ${["source", ...split].join("?.")}
    }`
            builder.append("post-ifs", conditionalAssignment);
            return;
        }

        // do not map everything, only what is needed
    }

    private _appendEnricher(property: PropertyInfo<any>, builder: FunctionBuilder<"variables" | "enrichments" | "functions" | "entity" | "change-tracking">, value: string, selectorPath: string) {

        const split = selectorPath.split(/\.|\?\./g);

        if (property.functionBody != null) {

            if (property.type === SchemaTypes.Computed) {
                const fn = this._toNamedFunction(property.functionBody.toString());
                const ifEnricher = this._createIfAssignment(split, `${fn.name}(enriched, tableName)`, "enriched");

                builder.append("functions", fn.body);
                builder.append("enrichments", ifEnricher);
                return;
            }

            // function
            const fn = this._toNamedFunction(property.functionBody.toString());
            const changedFunction = fn.build(`() => ${fn.returning}`)
            const ifEnricher = this._createIfAssignment(split, `${fn.name}(enriched, tableName)`, "enriched");

            builder.append("functions", changedFunction);
            builder.append("enrichments", ifEnricher);
            return
        }

        if (property.defaultValue != null) {

            if (typeof property.defaultValue === "function") {
                const fn = this._toNamedFunction(property.defaultValue.toString());
                builder.append("functions", fn.body);

                if (property.parent == null) {
                    builder.append("entity", `${property.name}: ${selectorPath.split(".").join("?.")} ?? ${fn.name}(),`);
                    return;
                }

                // FIX ME
                builder.append("entity", `${selectorPath.split(".").join("?.")} ?? ${fn.name}()`);
                return;
            }

            if (property.parent == null) {
                builder.append("entity", `${property.name}: ${selectorPath.split(".").join("?.")} ?? ${this._toJson(property.defaultValue)}`);
                return;
            }
            // DO THIS
            return;
        }

        if (property.isIdentity === true) {

            const ifEnricher = this._createIfConditionalPropertyAssignment(split, "enriched");

            builder.append("enrichments", ifEnricher);
            return;
        }

        if (property.type === SchemaTypes.Object) {
            const changedPath = ["enriched", ...split.slice(1, split.length)].join(".");
            const enableChangeTracking = `
${changedPath} = enableChangeTracking(${changedPath}, "${property.getAssignmentPath()}", enriched);`
            builder.unshift("change-tracking", enableChangeTracking);
        }

        builder.append("entity", value);
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

    private _appendHashType(property: PropertyInfo<any>, builder: FunctionBuilder<"return">) {
        if (property.isKey === true) {
            builder.append("return", `${property.getSelectrorPath("entity")} == null`);
        }
    }

    compile(): CompiledSchema<T> {

        const schema = this;

        // Prepare should strip and serialize
        const prepareBuilder = new FunctionBuilder().use("return").use("functions").use("optionals");
        const hashTypeBuilder = new FunctionBuilder().use("return");
        const hashBuilder = new FunctionBuilder().use("return-object").use("return-ids").use("functions");
        const deserializeBuilder = new FunctionBuilder().use("return").use("variables");
        const stripperLines: string[] = [];
        const cloneLines: string[] = [];
        const compareFunction: { returnBody: string[], declarations: string[] } = { declarations: [], returnBody: [] };
        const mergeFunciton = new FunctionBuilder().use("assignments").use("functions").use("deserializers").use("post-ifs");
        const enrichFunciton = new FunctionBuilder().use("enrichments").use("functions").use("variables").use("entity").use("change-tracking");
        hashBuilder.append("functions", `
    function stringifyDate(d) {

        if (typeof d === "string") {
            return d;
        }

        if ("toISOString" in d) {
            return d.toISOString();
        }

        return d.toString();
    }`);

        mergeFunciton.append("functions", `
    function pause() {
        // initiate change tracking if needed
        if (destination.__tracking__ == null) {
            destination.__tracking__ = {};
        }

        destination.__tracking__.isPaused = true;
    }    

    function unpause() {
        destination.__tracking__.isPaused  = false;
    }    
`)

        // Call _iterate to process the schema and build the function body
        const idPropertyNames: string[] = [];
        const allPropertyNamesAndPaths: string[] = [];
        let hashType: HashType = HashType.Ids;
        let hasIdentities = false;
        let hasIdentityKeys = false;

        this._iterate(schema, (property) => {

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

            // Generate property code based on type
            if (property.type === SchemaTypes.Object) {

                const closureStart = `
                    ${name}: ${isPropertyNullableOrOptional ? `${selectorPath} ? {` : `{`}`;

                this._appendPrepare(property, prepareBuilder, closureStart);
                this._appendHashMapper(property, hashBuilder, selectorPath)
                this._appendStripper(property, stripperLines, closureStart);
                this._appendCloner(property, cloneLines, closureStart);
                this._appendDeserializer(property, deserializeBuilder, closureStart);
                this._appendEnricher(property, enrichFunciton, closureStart, selectorPath);
                this._appendMerge(property, mergeFunciton, closureStart, selectorPath);


                property.children.forEach((nestedProperty, index) => {

                    const nestedSelectorPath = `${selectorPath}${isPropertyNullableOrOptional ? "?" : ""}.${nestedProperty.name}`;
                    const isNestedNullableOrOptional = nestedProperty.isNullable || nestedProperty.isOptional || isPropertyNullableOrOptional;

                    if (nestedProperty.type === SchemaTypes.Object) {

                        const nestedAssignment = `
                            ${nestedProperty.name}: ${isNestedNullableOrOptional ? `${nestedSelectorPath} ? {` : `{`}`;

                        this._appendPrepare(nestedProperty, prepareBuilder, nestedAssignment, nestedSelectorPath);
                        this._appendStripper(nestedProperty, stripperLines, nestedAssignment);
                        this._appendCloner(nestedProperty, cloneLines, nestedAssignment);
                        this._appendDeserializer(nestedProperty, deserializeBuilder, nestedAssignment, nestedSelectorPath);
                        this._appendEnricher(nestedProperty, enrichFunciton, nestedAssignment, nestedSelectorPath);
                        this._appendMerge(nestedProperty, mergeFunciton, nestedAssignment, nestedSelectorPath);

                        // Recursively add properties for deeply nested objects
                        nestedProperty.children.forEach((deepProperty, deepIndex) => {
                            const deepSelectorPath = `${nestedSelectorPath}${isNestedNullableOrOptional ? "?" : ""}.${deepProperty.name}`;

                            const deeplyNestedAssignment = `
                                ${deepProperty.name}: ${isNestedNullableOrOptional ? `${deepSelectorPath} ?? null` : deepSelectorPath}${deepIndex < deepProperty.children.length - 1 ? "," : ""}`;
                            this._appendPrepare(deepProperty, prepareBuilder, deeplyNestedAssignment, deepSelectorPath);
                            this._appendHashMapper(deepProperty, hashBuilder, deepSelectorPath);
                            this._appendStripper(deepProperty, stripperLines, deeplyNestedAssignment);
                            this._appendCloner(deepProperty, cloneLines, deeplyNestedAssignment);
                            this._appendDeserializer(deepProperty, deserializeBuilder, deeplyNestedAssignment, deepSelectorPath);
                            this._appendEnricher(deepProperty, enrichFunciton, deeplyNestedAssignment, deepSelectorPath);
                            this._appendMerge(deepProperty, mergeFunciton, deeplyNestedAssignment, deepSelectorPath);
                            this._appendCompare(deepProperty, compareFunction, deepSelectorPath);
                        });

                        const nestedClosure = `}${isNestedNullableOrOptional ? ` : null` : ""}${index < property.children.length - 1 ? "," : ""}`;

                        prepareBuilder.append("return", nestedClosure);
                        deserializeBuilder.append("return", nestedClosure);
                        stripperLines.push(nestedClosure);
                        cloneLines.push(nestedClosure);
                        enrichFunciton.append("entity", nestedClosure);
                        return;
                    }

                    const assignment = `
                        ${nestedProperty.name}: ${isNestedNullableOrOptional ? `${nestedSelectorPath} ?? null` : nestedSelectorPath}${index < property.children.length - 1 ? "," : ""}`;

                    this._appendPrepare(nestedProperty, prepareBuilder, assignment, nestedSelectorPath);
                    this._appendHashMapper(nestedProperty, hashBuilder, nestedSelectorPath);
                    this._appendStripper(nestedProperty, stripperLines, assignment);
                    this._appendCloner(nestedProperty, cloneLines, assignment);
                    this._appendDeserializer(nestedProperty, deserializeBuilder, assignment, nestedSelectorPath);
                    this._appendEnricher(nestedProperty, enrichFunciton, assignment, nestedSelectorPath);
                    this._appendMerge(nestedProperty, mergeFunciton, assignment, nestedSelectorPath);
                    this._appendCompare(nestedProperty, compareFunction, nestedSelectorPath);
                });

                const closureEnd = `}${isPropertyNullableOrOptional ? ` : null` : ""}${property.children.length > 0 ? "," : ""}`;

                prepareBuilder.append("return", closureEnd);
                deserializeBuilder.append("return", closureEnd);
                stripperLines.push(closureEnd);
                cloneLines.push(closureEnd);
                enrichFunciton.append("entity", closureEnd);
                return;
            }

            if (property.type === SchemaTypes.Array) {
                // Arrays

                const arrayAssignment = `
                    ${name}: ${isPropertyNullableOrOptional ? `${selectorPath} ? [...(${selectorPath} || [])] : null` : `[...${selectorPath}]`},`;
                this._appendPrepare(property, prepareBuilder, arrayAssignment, selectorPath);
                this._appendHashMapper(property, hashBuilder, selectorPath);
                this._appendStripper(property, stripperLines, arrayAssignment);
                this._appendCloner(property, cloneLines, arrayAssignment);
                this._appendDeserializer(property, deserializeBuilder, arrayAssignment, selectorPath);
                this._appendEnricher(property, enrichFunciton, arrayAssignment, selectorPath);
                this._appendMerge(property, mergeFunciton, arrayAssignment, selectorPath)
                this._appendCompare(property, compareFunction, selectorPath);
                return;
            }

            if (property.isKey === true && property.isIdentity === true) {
                hashType = HashType.Object;
            }

            const primitiveAssignment = `
             ${name}: ${isPropertyNullableOrOptional ? `${selectorPath} ?? null` : selectorPath},`;
            this._appendPrepare(property, prepareBuilder, primitiveAssignment, selectorPath);
            this._appendHashMapper(property, hashBuilder, selectorPath);
            this._appendStripper(property, stripperLines, primitiveAssignment);
            this._appendCloner(property, cloneLines, primitiveAssignment);
            this._appendDeserializer(property, deserializeBuilder, primitiveAssignment, selectorPath);
            this._appendEnricher(property, enrichFunciton, primitiveAssignment, selectorPath);
            this._appendMerge(property, mergeFunciton, primitiveAssignment, selectorPath);
            this._appendCompare(property, compareFunction, selectorPath);
            this._appendHashType(property, hashTypeBuilder);
        });

        const hashTypeFunctionBody = `
    if (${hashTypeBuilder.join("return", " || ")}) {
        return "Object";
    }

    return "Ids"
`;
        const prepareFunctionBody = `
    ${prepareBuilder.join("functions", "")} 

    const result = { 
        ${prepareBuilder.join("return", "").replace(/,\s*$/, "")} 
    };

    ${prepareBuilder.join("optionals", "\r\n")}

    return result;
`;
        const stripFunctionBody = `return {${stripperLines.join("").replace(/,\s*$/, "")}};`;
        const cloneFunctionBody = `return {${cloneLines.join("").replace(/,\s*$/, "")}};`;
        const deserializeFunctionBody = `${deserializeBuilder.join("variables", ";")}  return {${deserializeBuilder.join("return", "").replace(/,\s*$/, "")}};`;
        const enrichFunctionBody = `
    return function(entity) { 

        function ${this.createChangeTracker.toString()}

        const enableChangeTracking = createChangeTracker();

        ${enrichFunciton.join("functions", "\r\n")} 
        const enriched = {
            ${enrichFunciton.join("entity", "").replace(/,\s*$/, "")}
        }; 

        ${enrichFunciton.join("enrichments", "")} 

        ${enrichFunciton.join("change-tracking", "\r\n")} 

        return enableChangeTracking(enriched); 
    }`;

        const mergeFunctionBody = `
    return function(destination, source) {

        ${mergeFunciton.join("functions", "\r\n")}

        pause();

        ${mergeFunciton.join("assignments", ";\r\n")}

        ${mergeFunciton.join("post-ifs", "\r\n")}

        unpause();

        return destination; 
    }`;
        const compareFunctionBody = `${compareFunction.declarations.join(";")}  return ${compareFunction.returnBody.join(" && ").replace(/,\s*$/, "")};`
        const hashFunctionBody = `${
    hashBuilder.join("functions", "")} 
    
    if (type === "Ids") {
        return \`${hashBuilder.join("return-ids", "")}\`;
    }

    return \`${hashBuilder.join("return-object", "")}\`;`

        // enrich should enable change tracking!

        // merge needs to run any deserializers too
        const merge = Function("tableName", mergeFunctionBody)(this.tableName) as (destination: NonNullEntity<T>, source: NonNullEntity<T>) => NonNullEntity<T>;
        const prepare = Function("entity", prepareFunctionBody) as (entity: NonNullCreateEntity<T>) => NonNullCreateEntity<T>;
        const enrich = Function("tableName", enrichFunctionBody)(this.tableName) as (entity: NonNullEntity<T>) => NonNullEntity<T>;
        const strip = Function("entity", stripFunctionBody) as (entity: NonNullEntity<T>) => NonNullEntity<T>;
        const clone = Function("entity", cloneFunctionBody) as (entity: NonNullEntity<T>) => NonNullEntity<T>;
        const compare = Function("a", "b", compareFunctionBody) as (a: NonNullEntity<T>, b: NonNullEntity<T>) => boolean;
        const deserialize = Function("entity", deserializeFunctionBody) as (entity: NonNullEntity<T>) => NonNullEntity<T>;
        const idSelectorFunction = Function("entity", `return [${idPropertyNames.map(w => `entity.${w}`).join(",")}];`) as (entity: NonNullEntity<T>) => [IdType];
        const toHash = Function("entity", "type", hashFunctionBody) as HashFunction<T>;
        const getHashType = Function("entity", hashTypeFunctionBody) as GetHashTypeFunction<T>;

        return {
            idPropertyNames,
            hasIdentities,
            hashType,
            getHashType,
            merge,
            prepare,
            clone,
            deserialize,
            compare,
            strip,
            hash: toHash,
            key: hash([...allPropertyNamesAndPaths, this.tableName].join(",")),
            getIds: idSelectorFunction,
            enrich,
            tableName: this.tableName,
            hasIdentityKeys
        }
    }
}
