import { SchemaArray } from "./property/types/Array";
import { SchemaBase } from "./property/base/Base";
import { SchemaBoolean } from "./property/types/Boolean";
import { SchemaDate } from "./property/types/Date";
import { SchemaDefinition } from "./Definition";
import { SchemaNumber } from "./property/types/Number";
import { SchemaObject } from "./property/types/Object";
import { SchemaString } from "./property/types/String";
import { IdType } from "../types";
import { PropertyInfo } from "../common/PropertyInfo";

// this non-null stuff can be removed
// export type InferType<T extends {}> = InferType<T>;
// export type InferCreateType<T extends {}> = InferCreateType<T>;

export enum SchemaTypes {
    Array = "Array",
    Boolean = "Boolean",
    Date = "Date",
    Number = "Number",
    Object = "Object",
    String = "String",
    Definition = "Definition",
    Function = "Function",
    Computed = "Computed"
}

export const s = {
    number: <T extends number = number>() => new SchemaNumber<T, never>(),
    string: <T extends string = string>() => new SchemaString<T, never>(),
    boolean: <T extends boolean = boolean>() => new SchemaBoolean<T, never>(),
    date: <T extends Date = Date>() => new SchemaDate<T, never>(),
    array: <T extends any>() => new SchemaArray<T, never>(),
    object: <T extends {} = {}>(schema: T) => new SchemaObject<T, never>(schema),
    define: <T extends {}>(tableName: string, schema: T) => new SchemaDefinition<T>(tableName, schema)
}

export type ExpandedProperty = ExpandedChildProperty & {
    assignmentPath: string;
    selectorPath: string;
    properties: Map<string, ExpandedChildProperty>;
    childDegree: number;
};

export type ExpandedChildProperty = {
    propertyName: string;
    type: SchemaTypes;
    isNullableOrOptional: boolean;
    isReadonly: boolean;
    isIdentity: boolean;
    isUnmapped: boolean;
}

export enum HashType {
    Ids = "Ids",
    Object = "Object"
}

export type HashFunction<TEntity extends {}> = {
    (entity: InferCreateType<TEntity>, type: HashType.Object): string;
    (entity: InferType<TEntity>, type: HashType.Ids): string;
}

export type GetHashTypeFunction<TEntity extends {}> = {
    (entity: InferCreateType<TEntity>): HashType.Object;
    (entity: InferType<TEntity>): HashType.Ids;
}

export type ChangeTrackingType = "entity" | "immutable";

export type CompiledSchema<TEntity extends {}> = {
    getId: (entity: InferType<TEntity>) => IdType;
    clone: (entity: InferType<TEntity>) => InferType<TEntity>;
    strip: (entity: InferType<TEntity>) => InferType<TEntity>;
    prepare: (entity: InferCreateType<TEntity>) => InferCreateType<TEntity>;
    merge: (destination: InferType<TEntity>, source: InferType<TEntity>) => InferType<TEntity>;
    hasIdentities: boolean;
    idPropertyNames: string[];
    properties: PropertyInfo<TEntity>[],
    hashType: HashType;
    hash: HashFunction<TEntity>;
    getHashType: GetHashTypeFunction<TEntity>;
    compare: (a: InferType<TEntity>, fromDb: InferType<TEntity>) => boolean;
    deserialize: (entity: InferType<TEntity>) => InferType<TEntity>;
    key: number,
    tableName: string;
    getIds: (entity: InferType<TEntity>) => [IdType];
    enrich: (entity: InferType<TEntity>, changeTrackingType: ChangeTrackingType) => InferType<TEntity>;
    hasIdentityKeys: boolean;
    freeze: (entity: InferType<TEntity>) => InferType<TEntity>;
    enableChangeTracking: (entity: InferType<TEntity>) => InferType<TEntity>;
}

export type PropertySerializer<T extends any> = (value: T) => string | number;
export type PropertyDeserializer<T extends any> = (value: string | number) => T;

export { SchemaArray } from "./property/types/Array";
export { SchemaBase } from "./property/base/Base";
export { SchemaBoolean } from "./property/types/Boolean";
export { SchemaDate } from "./property/types/Date";
export { SchemaDefinition } from "./Definition";
export { SchemaNumber } from "./property/types/Number";
export { SchemaObject } from "./property/types/Object";
export { SchemaString } from "./property/types/String";
export { SchemaKey } from "./property/modifiers/Key";
export { SchemaReadonly } from "./property/modifiers/Readonly";
export { SchemaIdentity } from "./property/modifiers/Identity";

export type SchemaModifiers = "default" | "deserialize" |
    "identity" | "key" |
    "nullable" | "optional" |
    "readonly" | "serialize" |
    "unmapped" | "computed";

type InferPrimitive<T> =
    T extends SchemaObject<infer Obj, infer _> ?
    { [K in keyof Obj]: InferPrimitive<Obj[K]> } : // Process nested objects
    T extends SchemaBase<infer X, infer _> ?
    X : // Extract the primitive type
    never;

const nested = s.define("MY_NESTED_TABLE", {
    _id: s.string().key().identity(),
    _rev: s.string().identity(),
    test: s.string().optional(),
    updatedAt: s.date().nullable(),
    order: s.number().default((d) => d.test, { test: 1 }),
    name: s.string().readonly(),
    child: s.object({
        name: s.string(),
        nested: s.object({
            winner: s.number(),
            more: s.object({
                final: s.number(),
                array: s.array<string>()
            })
        })
    })
}).modify(w => ({
    documentType: w.computed((_, t) => t).tracked()
})).compile();

export type InferType<T> = T extends CompiledSchema<infer R> ? InferCompiledSchema<R> : T extends {} ? InferCompiledSchema<T> : unknown;
export type InferCreateType<T> = T extends CompiledSchema<infer R> ? InferCompiledCreateSchema<R> : T extends {} ? InferCompiledCreateSchema<T> : unknown;

type HasModifier<T, K extends keyof T, M extends SchemaModifiers> =
    T[K] extends SchemaBase<any, infer Mods> ?
    M extends Mods ? true : false :
    false;

type IsPlainProperty<T, K extends keyof T> =
    [
        HasModifier<T, K, "readonly">,
        HasModifier<T, K, "optional">,
        HasModifier<T, K, "nullable">
    ] extends [
        false,
        false,
        false
    ] ? true : false;

type IsPlainCreateProperty<T, K extends keyof T> =
    [
        HasModifier<T, K, "identity">,
        HasModifier<T, K, "default">,
        HasModifier<T, K, "computed">,
        HasModifier<T, K, "unmapped">,
        HasModifier<T, K, "optional">,
        HasModifier<T, K, "nullable">
    ] extends [
        false,
        false,
        false,
        false,
        false,
        false
    ] ? true : false;

type InferCompiledSchema<T> = CoalesceEmpty<{
    [K in keyof T as IsPlainProperty<T, K> extends true ? K : never]: InferPrimitive<T[K]>
}, {
        readonly [K in keyof T as HasModifier<T, K, "readonly"> extends true ? K : never]: InferPrimitive<T[K]>
    }, {
        [K in keyof T as HasModifier<T, K, "optional"> extends true ? K : never]?: InferPrimitive<T[K]>
    }, {
        [K in keyof T as HasModifier<T, K, "nullable"> extends true ? K : never]: null | InferPrimitive<T[K]>
    }>;

type InferCompiledCreateSchema<T> = CoalesceEmpty<{
    [K in keyof T as IsPlainCreateProperty<T, K> extends true ? K : never]: InferPrimitive<T[K]>
}, {
        [K in keyof T as HasModifier<T, K, "optional"> extends true ? K : never]?: InferPrimitive<T[K]>
    }, {
        [K in keyof T as HasModifier<T, K, "default"> extends true ? K : never]?: InferPrimitive<T[K]>
    }, {
        [K in keyof T as HasModifier<T, K, "nullable"> extends true ? K : never]: null | InferPrimitive<T[K]>
    }>;

type IsEmptyObject<T> = keyof T extends never ? true : false;
type CoalesceEmpty<T1 extends {}, T2 extends {}, T3 extends {}, T4 extends {}> = (IsEmptyObject<T1> extends true ? {} : T1) & (IsEmptyObject<T2> extends true ? {} : T2) & (IsEmptyObject<T3> extends true ? {} : T3) & (IsEmptyObject<T4> extends true ? {} : T4);