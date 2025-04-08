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

export type NonNullEntity<T extends {}> = NonNullable<InferType<SchemaDefinition<T>>>;
export type NonNullCreateEntity<T extends {}, TOmit extends string = never> = NonNullable<Omit<InferCreateType<SchemaDefinition<T>>, TOmit>>;

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

export type SchemaModifiers = "default" | "deserialize" |
    "identity" | "key" |
    "nullable" | "optional" |
    "readonly" | "serialize" |
    "unmapped" | "computed";

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
    (entity: NonNullCreateEntity<TEntity>, type: HashType.Object): string;
    (entity: NonNullEntity<TEntity>, type: HashType.Ids): string;
}

export type GetHashTypeFunction<TEntity extends {}> = {
    (entity: NonNullCreateEntity<TEntity>): HashType.Object;
    (entity: NonNullEntity<TEntity>): HashType.Ids;
}

export type ChangeTrackingType = "entity" | "immutable";

export type CompiledSchema<TEntity extends {}> = {
    getId: (entity: NonNullEntity<TEntity>) => IdType;
    clone: (entity: NonNullEntity<TEntity>) => NonNullEntity<TEntity>;
    strip: (entity: NonNullEntity<TEntity>) => NonNullEntity<TEntity>;
    prepare: (entity: NonNullCreateEntity<TEntity>) => NonNullCreateEntity<TEntity>;
    merge: (destination: NonNullEntity<TEntity>, source: NonNullEntity<TEntity>) => NonNullEntity<TEntity>;
    hasIdentities: boolean;
    idPropertyNames: string[];
    properties: PropertyInfo<TEntity>[],
    hashType: HashType;
    hash: HashFunction<TEntity>;
    getHashType: GetHashTypeFunction<TEntity>;
    compare: (a: NonNullEntity<TEntity>, fromDb: NonNullEntity<TEntity>) => boolean;
    deserialize: (entity: NonNullEntity<TEntity>) => NonNullEntity<TEntity>;
    key: number,
    tableName: string;
    getIds: (entity: NonNullEntity<TEntity>) => [IdType];
    enrich: (entity: NonNullEntity<TEntity>, changeTrackingType: ChangeTrackingType) => NonNullEntity<TEntity>;
    hasIdentityKeys: boolean;
    freeze: (entity: NonNullEntity<TEntity>) => NonNullEntity<TEntity>;
    enableChangeTracking: (entity: NonNullEntity<TEntity>) => NonNullEntity<TEntity>;
}

export type PropertySerializer<T extends any> = (value: T) => string | number;
export type PropertyDeserializer<T extends any> = (value: string | number) => T;

export type InferSchema<T> =
    T extends CompiledSchema<infer R> ?
    { [K in keyof R]: { name: K; type: InferPrimitive<R[K]>; modifiers: GetModifiers<R[K]> } } :
    T extends SchemaDefinition<infer R> ? { [K in keyof R]: { name: K; type: InferPrimitive<R[K]>; modifiers: GetModifiers<R[K]> } } : never;

type InferPrimitive<T> =
    T extends SchemaObject<infer Obj, any> ?
    { [K in keyof Obj]: { name: K; type: InferPrimitive<Obj[K]>; modifiers: GetModifiers<Obj[K]> } } : // Process nested objects
    T extends SchemaBase<infer X, infer M> ?
    Apply<X, M> : // Extract the primitive type
    never;

type GetModifiers<T> =
    T extends SchemaBase<any, infer ZZ> ? ZZ : // Extract the modifiers from SchemaBase
    T extends SchemaObject<any, infer Z> ? Z : // Extract the modifiers from SchemaObject
    never;

export type InferTypeFromSchema<T> = {
    [K in keyof T]: T[K] extends { type: infer U; modifiers: infer M }
    ? ApplyModifiers<InferSchemaPrimitive<U>, M>
    : never;
};

// Read Type
export type InferType<T> = InferTypeFromSchema<InferSchema<T>>;

// Create Type
export type InferCreateType<T> = InferTypeFromSchema<OmitUnmapped<OmitIdentities<OmitDefaults<InferSchema<T>>>>>;

export type InferSchemaPrimitive<T> =
    T extends (...args: any[]) => any
    ? T // Handle functions explicitly
    : T extends Date
    ? Date // Handle Date explicitly
    : T extends Array<infer U>
    ? InferSchemaPrimitive<U>[] // Handle arrays recursively
    : T extends object
    ? { [K in keyof T]: T[K] extends { type: infer U; modifiers: infer M } ? ApplyModifiers<InferSchemaPrimitive<U>, M> : never }
    : T; // Handle primitives

type ApplyTypeModifiers<T, M> = ApplyReadonly<ApplyNullable<ApplyUndefined<T, M>, M>, M>;

type ApplyModifiers<T, M> = T extends (...args: any[]) => any ? T : T extends Array<infer U> ? T : T extends Date ? T : T extends object
    ? { [K in keyof T]: T[K] } // Ensure valid object types
    : [M] extends [never] // Use a non-distributive conditional check
    ? T
    : ApplyTypeModifiers<T, M>;

type Apply<T, M> = T extends Array<infer U> ? ApplyArray<T, M> : ApplyArray<T, M>;

type ApplyArray<T, M> =
    [M] extends [never] // Use a non-distributive conditional check
    ? T
    : ApplyTypeModifiers<T, M>;

type ApplyReadonly<T, M> = M extends "readonly" ? Readonly<T> : T;
type ApplyNullable<T, M> = M extends "nullable" ? T | null : T;
type ApplyUndefined<T, M> = M extends "optional" ? T | undefined : T;

export type OmitDefaults<T> = {
    [K in keyof T as T[K] extends { modifiers: infer M }
    ? "default" extends M
    ? never
    : K
    : K]: T[K] extends { type: infer R; name: infer N; modifiers: infer M }
    ? { name: N; type: R extends Array<any> ? R : R extends Date ? R : (R extends object ? OmitDefaults<R> : R); modifiers: M }
    : never;
};

export type OmitIdentities<T> = {
    [K in keyof T as T[K] extends { modifiers: infer M }
    ? "identity" extends M
    ? never
    : K
    : K]: T[K] extends { type: infer R; name: infer N; modifiers: infer M }
    ? { name: N; type: R extends Array<any> ? R : R extends Date ? R : (R extends object ? OmitDefaults<R> : R); modifiers: M }
    : never;
};

export type OmitUnmapped<T> = {
    [K in keyof T as T[K] extends { modifiers: infer M }
    ? "unmapped" extends M
    ? never
    : K
    : K]: T[K] extends { type: infer R; name: infer N; modifiers: infer M }
    ? { name: N; type: R extends Array<any> ? R : R extends Date ? R : (R extends object ? OmitDefaults<R> : R); modifiers: M }
    : never;
};


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


type InferType2 = 
T extends CompiledSchema<infer R> ?
{ [K in keyof R]: { name: K; type: InferPrimitive<R[K]>; modifiers: GetModifiers<R[K]> } } :
T extends SchemaDefinition<infer R> ? { [K in keyof R]: { name: K; type: InferPrimitive<R[K]>; modifiers: GetModifiers<R[K]> } } : never;

/// TESTING

const nested = s.define("MY_NESTED_TABLE", {
    _id: s.string().key().identity(),
    _rev: s.string().identity(),
    order: s.number().default((d) => d.test, { test: 1 }),
    name: s.string(),
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

type Test = InferType<typeof nested>;