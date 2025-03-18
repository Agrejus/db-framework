import { CompiledSchema, GetHashTypeFunction, HashFunction, HashType, InferType, NonNullCreateEntity, NonNullEntity, SchemaTypes } from ".";
import { SchemaFunction } from './table/Function';
import { SchemaComputed } from './table/Computed';
import { SchemaBase } from "./property/base/Base";
import { createUUID, hash } from "../utilities";
import { PropertyInfo } from '../common/PropertyInfo';
import { CodeBuilder, ContainerBlock, ObjectBuilder, Insert, FunctionFactoryBuilder, SlotBlock, AssignmentBuilder } from '../common/CodeBlock';
import { SlotPath } from '../common/SlotPath';
import { EnrichmentHandlerBuilder } from '../handlers/EnrichmentHandlerBuilder';
import { MergeHandlerBuilder } from '../handlers/MergeHandlerBuilder';
import { PrepareHandlerBuilder } from '../handlers/PrepareHandlerBuilder';
import { StripHandlerBuilder } from '../handlers/StripHandlerBuilder';
import { CloneHandlerBuilder } from '../handlers/CloneHandlerBuilder';
import { CompareHandlerBuilder } from '../handlers/CompareHandlerBuilder';
import { DeserializeHandlerBuilder } from '../handlers/DeserializeHandlerBuilder';
import { HashTypeHandlerBuilder } from '../handlers/HashTypeHandlerBuilder';
import { IdSelectorHandlerBuilder } from '../handlers/IdSelectorHandlerBuilder';
import { HashHandlerBuilder } from '../handlers/HashHandlerBuilder';
import { IdType } from "../types";

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

    compile(): CompiledSchema<T> {

        const schema = this;
        const properties: PropertyInfo<T>[] = [];

        const enrichmentHandlerBuilder = new EnrichmentHandlerBuilder();
        const mergeHandlerFactory = new MergeHandlerBuilder();
        const prepareHandlerBuilder = new PrepareHandlerBuilder();
        const stripHandlerBuilder = new StripHandlerBuilder();
        const cloneHandlerBuilder = new CloneHandlerBuilder();
        const compareHandlerBuilder = new CompareHandlerBuilder();
        const deserializeHandlerBuilder = new DeserializeHandlerBuilder();
        const hashTypeHandlerBuilder = new HashTypeHandlerBuilder();
        const idSelectorHandlerBuilder = new IdSelectorHandlerBuilder();
        const hashHandlerBuilder = new HashHandlerBuilder();

        const enricher = enrichmentHandlerBuilder.build();
        const merge = mergeHandlerFactory.build();
        const prepare = prepareHandlerBuilder.build();
        const strip = stripHandlerBuilder.build();
        const clone = cloneHandlerBuilder.build();
        const compare = compareHandlerBuilder.build();
        const deserialize = deserializeHandlerBuilder.build();
        const hashTypeHandler = hashTypeHandlerBuilder.build();
        const idSelectorHandler = idSelectorHandlerBuilder.build();
        const hashHandler = hashHandlerBuilder.build();

        const enricherCodeBuilder = new CodeBuilder();
        const enricherFunctionRoot = enricherCodeBuilder.factory("factory", { name: "factory" }).parameters({ name: "tableName", value: this.tableName });
        const enricherFunctionBody = enricherFunctionRoot.function(undefined, { name: "function" }).parameters("entity", "changeTrackingType").return();

        enricherFunctionBody.raw(`function ${this.createChangeTracker.toString()}`);
        enricherFunctionBody.variable("enableChangeTracking").value('changeTrackingType === "entity" ? createChangeTracker() : e => e');

        enricherFunctionBody.slot("enriched");
        enricherFunctionBody.slot("declarations");
        enricherFunctionBody.slot("ifs");
        enricherFunctionBody.slot("assignment");
        enricherFunctionBody.raw('\treturn enableChangeTracking(enriched);');

        const mergeCodeBuilder = new CodeBuilder();
        const mergeFunctionsSlot = mergeCodeBuilder.slot("functions")

        mergeFunctionsSlot.function("pause")
            .appendBody("// initiate change tracking if needed")
            .if("destination.__tracking__ == null")
            .appendBody("destination.__tracking__ = {};")
            .appendBody("destination.__tracking__.isPaused = true;");

        mergeFunctionsSlot.function("unpause")
            .appendBody("destination.__tracking__.isPaused  = false;");

        mergeCodeBuilder.slot("header").raw(`pause()`);
        mergeCodeBuilder.slot("assignments");
        mergeCodeBuilder.slot("return").raw(`
    unpause();

    return destination;`);

        const prepareCodeBuilder = new CodeBuilder();
        prepareCodeBuilder.slot("result");
        prepareCodeBuilder.slot("assignments");
        prepareCodeBuilder.slot("return").raw(`     return result;`);

        const stripCodeBuilder = new CodeBuilder();
        stripCodeBuilder.slot("result");
        stripCodeBuilder.slot("return").raw(`     return result;`);

        const cloneCodeBuilder = new CodeBuilder();
        cloneCodeBuilder.slot("result");
        cloneCodeBuilder.slot("return").raw(`     return result;`);

        const compareCodeBuilder = new CodeBuilder();
        compareCodeBuilder.slot("result");
        compareCodeBuilder.slot("return").raw(`     return result;`);

        const deserializeCodeBuilder = new CodeBuilder();
        deserializeCodeBuilder.slot("result");
        deserializeCodeBuilder.slot("return").raw(`     return result;`);

        const idSelectorCodeBuilder = new CodeBuilder();
        idSelectorCodeBuilder.slot("result");
        idSelectorCodeBuilder.slot("return").raw(`     return result;`);

        const hashTypeCodeBuilder = new CodeBuilder();
        hashTypeCodeBuilder.slot("ifs");
        hashTypeCodeBuilder.slot("return").raw(`     return "Ids";`);

        const hashCodeBuilder = new CodeBuilder();
        hashCodeBuilder.slot("functions").raw(`
    function stringifyDate(d) {

        if (typeof d === "string") {
            return d;
        }

        if ("toISOString" in d) {
            return d.toISOString();
        }

        return d.toString();
    } 
`);
        const hashCodeBuilderIfBlock = hashCodeBuilder.if(`type === "Ids"`, { name: "hash-id-if" });
        hashCodeBuilderIfBlock.slot("if-body");
        hashCodeBuilderIfBlock.appendBody("return result");
        hashCodeBuilder.slot("hash-object-return");
        hashCodeBuilder.raw(`   return result;`)

        const stringifier = new CodeBuilder();
        const returnObject = stringifier.object();

        const idPropertyNames: string[] = [];
        const allPropertyNamesAndPaths: string[] = [];
        let hashType: HashType = HashType.Ids;
        let hasIdentities = false;
        let hasIdentityKeys = false;

        this._iterate(schema, (property) => {

            properties.push(property);
            allPropertyNamesAndPaths.push(property.getSelectrorPath({ parent: "entity" }));

            // Check if the property or any parent is nullable/optional
            const isParentNullableOrOptional = property.hasNullableParents;
            const isPropertyNullableOrOptional = property.isNullable || property.isOptional || isParentNullableOrOptional;

            // Construct the selector path with or without null-safe operators
            const selectorPath = property.getSelectrorPath({ parent: "entity" });
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

            enricher.handle(property, enricherCodeBuilder);
            merge.handle(property, mergeCodeBuilder);
            prepare.handle(property, prepareCodeBuilder);
            strip.handle(property, stripCodeBuilder);
            clone.handle(property, cloneCodeBuilder);
            compare.handle(property, compareCodeBuilder);
            deserialize.handle(property, deserializeCodeBuilder);
            hashTypeHandler.handle(property, hashTypeCodeBuilder);
            idSelectorHandler.handle(property, idSelectorCodeBuilder);
            hashHandler.handle(property, hashCodeBuilder);
        });

        // console.log(prepareCodeBuilder.toString());
        // console.log(stripCodeBuilder.toString());
        // console.log(cloneCodeBuilder.toString());
        // console.log(compareCodeBuilder.toString());
        // console.log(deserializeCodeBuilder.toString());
        // console.log(hashTypeCodeBuilder.toString());
        // console.log(idSelectorCodeBuilder.toString());
        console.log(enricherCodeBuilder.toString());


        const params = enricherFunctionRoot.getParameters()
        const enrichGenerator = Function(`return ${enricherCodeBuilder.toString()}`);

        const mergeFunction = Function("destination", "source", mergeCodeBuilder.toString()) as (destination: NonNullEntity<T>, source: NonNullEntity<T>) => NonNullEntity<T>;;
        const getIdsFunction = Function("entity", idSelectorCodeBuilder.toString()) as (entity: NonNullEntity<T>) => [IdType];
        const getHashTypeFunction = Function("entity", hashTypeCodeBuilder.toString()) as GetHashTypeFunction<T>;
        const prepareFunction = Function("entity", prepareCodeBuilder.toString()) as (entity: NonNullCreateEntity<T>) => NonNullCreateEntity<T>;
        const cloneFunction = Function("entity", cloneCodeBuilder.toString()) as (entity: NonNullEntity<T>) => NonNullEntity<T>;
        const deserializeFunction = Function("entity", deserializeCodeBuilder.toString()) as (entity: NonNullEntity<T>) => NonNullEntity<T>;
        const compareFunction = Function("a", "b", compareCodeBuilder.toString()) as (a: NonNullEntity<T>, fromDb: NonNullEntity<T>) => boolean;;
        const stripFunction = Function("entity", stripCodeBuilder.toString()) as (entity: NonNullEntity<T>) => NonNullEntity<T>;
        const hashFunction = Function("entity", "type", hashCodeBuilder.toString()) as HashFunction<T>;

        const enricherFactoryFunction = enrichGenerator();
        const enricherFunction = enricherFactoryFunction(...params.map(w => w.value));

        const getId = (entity: NonNullEntity<T>) => {
            if (idPropertyNames.length > 1) {
                return hashFunction(entity, HashType.Ids) as IdType;
            }
    
            return getIdsFunction(entity as any)[0] as IdType;
        }

        return {
            getId,
            properties,
            idPropertyNames,
            hasIdentities,
            hashType,
            getHashType: getHashTypeFunction,
            merge: mergeFunction,
            prepare: prepareFunction,
            clone: cloneFunction,
            deserialize: deserializeFunction,
            compare: compareFunction,
            strip: stripFunction,
            hash: hashFunction,
            key: hash([...allPropertyNamesAndPaths, this.tableName].join(",")),
            getIds: getIdsFunction,
            enrich: enricherFunction,
            tableName: this.tableName,
            hasIdentityKeys
        }
    }
}
