export enum SchemaTypes {
    Array = "Array",
    Boolean = "Boolean",
    Date = "Date",
    Number = "Number",
    Object = "Object",
    String = "String",
    Definition = "Definition"
}

export type SchemaModifiers = "default" | "deserialize" |
    "identity" | "key" |
    "nullable" | "optional" |
    "readonly" | "serialize";

export type IdType = string | number;
export type PropertySerializer<T extends any> = (value: T) => string | number;
export type PropertyDeserializer<T extends any> = (value: string | number) => T;
export type DefaultValue<T> = T | (() => T);

export abstract class SchemaBase<T extends any, TModifiers extends SchemaModifiers> {

    abstract instance: T;
    modifiers: TModifiers;
    isNullable: boolean = false;
    isOptional: boolean = false;
    isKey: boolean = false;
    isIdentity: boolean = false;
    isReadonly: boolean = false;
    defaultValue: DefaultValue<T> | null = null;
    valueSerializer: PropertySerializer<T> | null = null;
    valueDeserializer: PropertyDeserializer<T> | null = null;
    type: SchemaTypes;
    private _schemaBase = true;

    constructor(entity?: SchemaBase<T, TModifiers>) {

        if (entity != null) {
            this.isNullable = entity.isNullable;
            this.isOptional = entity.isOptional;
            this.isKey = entity.isKey;
            this.isIdentity = entity.isIdentity;
            this.isReadonly = entity.isReadonly;
            this.defaultValue = entity.defaultValue;
            this.type = entity.type;
        }
    }
}

export class SchemaDefault<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {
    instance: T;
    private _schemaDefault = true;

    constructor(defaultValue: DefaultValue<T>, current: SchemaBase<T, TModifiers>) {
        super(current);
        this.defaultValue = defaultValue;
    }
}

export class SchemaDeserialize<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {
    instance: T;
    private _schemaDeserialize = true;

    constructor(deserializer: PropertyDeserializer<T>, current: SchemaBase<T, TModifiers>) {
        super(current);
        this.valueDeserializer = deserializer;
    }

    serializer(serializer: PropertySerializer<T>) {
        return new SchemaSerialize<T, TModifiers | "serialize">(serializer, this);
    }
}

export class SchemaIdentity<T extends string | number, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {
    instance: T;
    private _schemaIdentity = true;

    constructor(current: SchemaBase<T, TModifiers>) {
        super(current);
        this.isIdentity = true;
    }
}

export class SchemaKey<T extends IdType, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {
    instance: T;
    private _schemaKey = true;

    constructor(current: SchemaBase<T, TModifiers>) {
        super(current);
        this.isKey = true;
    }

    // will required a double save
    // first save with known id, save entity, then remove known id in favor of generated id and save again
    identity() {
        return new SchemaIdentity<T, TModifiers | "identity">(this);
    }
}

export class SchemaNullable<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {
    instance: T;
    private _schemaNullable = true;

    constructor(current: SchemaBase<T, TModifiers>) {
        super(current);
        this.isNullable = true;
    }

    optional() {
        return new SchemaOptional<T, TModifiers | "optional">(this);
    }

    readonly() {
        return new SchemaReadonly<T, TModifiers | "readonly">(this);
    }
}

export class SchemaOptional<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    private _schemaOptional = true;

    constructor(current: SchemaBase<T, TModifiers>) {
        super(current);
        this.isOptional = true;
    }

    nullable() {
        return new SchemaNullable<T, TModifiers | "nullable">(this);
    }
}

export class SchemaReadonly<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    private _schemaReadonly = true;

    constructor(current: SchemaBase<T, TModifiers>) {
        super(current);
        this.isReadonly = true;
    }

    default(value: T) {
        return new SchemaDefault<T, TModifiers | "default">(value, this);
    }

    deserializer(deserializer: PropertyDeserializer<T>) {
        return new SchemaDeserialize<T, TModifiers | "deserialize">(deserializer, this);
    }

    serializer(serializer: PropertySerializer<T>) {
        return new SchemaSerialize<T, TModifiers | "deserialize">(serializer, this);
    }
}

export class SchemaSerialize<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {
    instance: T;
    private _schemaSerialize = true;

    constructor(serializer: PropertySerializer<T>, current: SchemaBase<T, TModifiers>) {
        super(current);
        this.valueSerializer = serializer;
    }

    deserializer(deserializer: PropertyDeserializer<T>) {
        return new SchemaDeserialize<T, TModifiers | "deserialize">(deserializer, this);
    }
}

export class SchemaArray<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T[], TModifiers> {

    instance: T[];
    type = SchemaTypes.Array;
    private _schemaArray = true;

    optional() {
        return new SchemaOptional<T[], TModifiers | "optional">(this);
    }

    nullable() {
        return new SchemaNullable<T[], TModifiers | "nullable">(this);
    }

    default(value: DefaultValue<T[]>) {
        return new SchemaDefault<T[], TModifiers | "default">(value, this);
    }

    deserialize(deserializer: PropertyDeserializer<T[]>) {
        return new SchemaDeserialize<T[], TModifiers | "deserialize">(deserializer, this);
    }

    serialize(serializer: PropertySerializer<T[]>) {
        return new SchemaSerialize<T[], TModifiers | "serialize">(serializer, this);
    }
}

export class SchemaBoolean<T extends boolean, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    type = SchemaTypes.Boolean;
    private _schemaBoolean = true;

    optional() {
        return new SchemaOptional<T, TModifiers | "optional">(this);
    }

    nullable() {
        return new SchemaNullable<T, TModifiers | "nullable">(this);
    }

    default(value: DefaultValue<T>) {
        return new SchemaDefault<T, TModifiers | "default">(value, this);
    }

    readonly() {
        return new SchemaReadonly<T, TModifiers | "readonly">(this);
    }

    deserialize(deserializer: PropertyDeserializer<T>) {
        return new SchemaDeserialize<T, TModifiers | "deserialize">(deserializer, this);
    }

    serialize(serializer: PropertySerializer<T>) {
        return new SchemaSerialize<T, TModifiers | "serialize">(serializer, this);
    }
}

export class SchemaDate<T extends Date, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    type = SchemaTypes.Date;
    private _schemaDate = true;

    optional() {
        return new SchemaOptional<T, TModifiers | "optional">(this);
    }

    nullable() {
        return new SchemaNullable<T, TModifiers | "nullable">(this);
    }

    default(value: DefaultValue<T>) {
        return new SchemaDefault<T, TModifiers | "default">(value, this);
    }

    readonly() {
        return new SchemaReadonly<T, TModifiers | "readonly">(this);
    }

    deserialize(deserializer: PropertyDeserializer<T>) {
        return new SchemaDeserialize<T, TModifiers | "deserialize">(deserializer, this);
    }

    serialize(serializer: PropertySerializer<T>) {
        return new SchemaSerialize<T, TModifiers | "serialize">(serializer, this);
    }
}

export class SchemaNumber<T extends number, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    type = SchemaTypes.Number;
    private _schemaNumber = true;

    optional() {
        return new SchemaOptional<T, TModifiers | "optional">(this);
    }

    nullable() {
        return new SchemaNullable<T, TModifiers | "nullable">(this);
    }

    key() {
        return new SchemaKey<T, TModifiers | "key">(this);
    }

    default(value: DefaultValue<T>) {
        return new SchemaDefault<T, TModifiers | "default">(value, this);
    }

    readonly() {
        return new SchemaReadonly<T, TModifiers | "readonly">(this);
    }

    deserialize(deserializer: PropertyDeserializer<T>) {
        return new SchemaDeserialize<T, TModifiers | "deserialize">(deserializer, this);
    }

    serialize(serializer: PropertySerializer<T>) {
        return new SchemaSerialize<T, TModifiers | "serialize">(serializer, this);
    }
}

export class SchemaObject<T extends {}, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    type = SchemaTypes.Object;
    private _schemaObject = true;

    constructor(schema: T) {
        super();
        this.instance = schema;
    }

    optional() {
        return new SchemaOptional<T, TModifiers | "optional">(this);
    }

    nullable() {
        return new SchemaNullable<T, TModifiers | "nullable">(this);
    }

    default(value: DefaultValue<T>) {
        return new SchemaDefault<T, TModifiers | "default">(value, this);
    }
}

export class SchemaString<T extends string, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    type = SchemaTypes.String;
    private _schemaString = true;

    optional() {
        return new SchemaOptional<T, TModifiers | "optional">(this);
    }

    nullable() {
        return new SchemaNullable<T, TModifiers | "nullable">(this);
    }

    key() {
        return new SchemaKey<T, TModifiers | "key">(this);
    }

    default(value: DefaultValue<T>) {
        return new SchemaDefault<T, TModifiers | "default">(value, this);
    }

    readonly() {
        return new SchemaReadonly<T, TModifiers | "readonly">(this);
    }

    deserialize(deserializer: PropertyDeserializer<T>) {
        return new SchemaDeserialize<T, TModifiers | "deserialize">(deserializer, this);
    }

    serialize(serializer: PropertySerializer<T>) {
        return new SchemaSerialize<T, TModifiers | "serialize">(serializer, this);
    }
}

export const s = {
    number: <T extends number = number>() => new SchemaNumber<T, never>(),
    string: <T extends string = string>() => new SchemaString<T, never>(),
    boolean: <T extends boolean = boolean>() => new SchemaBoolean<T, never>(),
    date: <T extends Date = Date>() => new SchemaDate<T, never>(),
    array: <T extends any>() => new SchemaArray<T, never>(),
    object: <T extends {} = {}>(schema: T) => new SchemaObject<T, never>(schema),
    define: <T extends {}>(tableName: string, schema: T) => new SchemaDefinition<T, never>(tableName, schema)
}


export class SchemaDefinition<T extends {}, TEnhancedPropertyNames = never, TComputedPropertyNames = never> extends SchemaBase<T, any> {

    instance: T;
    type = SchemaTypes.Definition;
    tableName: string;
    enhancedPropertyNames: TEnhancedPropertyNames;
    computedPropertyNames: TComputedPropertyNames;

    constructor(tableName: string, schema: T) {
        super();
        this.tableName = tableName;
        this.instance = schema;
        this.isNullable = false;
        this.isOptional = false;
    }
}

export type InferSchema<T> =
    T extends SchemaDefinition<infer R, infer TE, infer TC> ?
    { [K in keyof R]: { name: K; type: InferPrimitive<R[K]>; modifiers: GetModifiers<R[K]> } } :
    never;

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

export type InferType<T> = InferTypeFromSchema<InferSchema<T>>

type InferSchemaPrimitive<T> =
    T extends Date
    ? Date // Handle Date explicitly
    : T extends Array<infer U>
    ? InferSchemaPrimitive<U>[] // Handle arrays recursively
    : T extends object
    ? { [K in keyof T]: T[K] extends { type: infer U; modifiers: infer M } ? ApplyModifiers<InferSchemaPrimitive<U>, M> : never }
    : T; // Handle primitives

type ApplyModifiers<T, M> = T extends Array<infer U> ? T : T extends Date ? T : T extends object
    ? { [K in keyof T]: T[K] } // Ensure valid object types
    : [M] extends [never] // Use a non-distributive conditional check
    ? T
    : ApplyTypeModifiers<T, M>;

type Apply<T, M> = T extends Array<infer U> ? ApplyArray<T, M> : ApplyArray<T, M>;

type ApplyArray<T, M> =
    [M] extends [never] // Use a non-distributive conditional check
    ? T
    : ApplyTypeModifiers<T, M>;

type IsNever<T> = [T] extends [never] ? true : false;

type ApplyTypeModifiers<T, M> = ApplyReadonly<ApplyNullable<ApplyUndefined<T, M>, M>, M>;
type ApplyReadonly<T, M> = M extends "readonly" ? Readonly<T> : T;
type ApplyNullable<T, M> = M extends "nullable" ? T | null : T;
type ApplyUndefined<T, M> = M extends "optional" ? T | undefined : T
export type OmitDefaults<T> = {
    [K in keyof T as T[K] extends { modifiers: infer M }
    ? "default" extends M
    ? never
    : K
    : K]: T[K] extends { type: infer R; name: infer N; modifiers: infer M }
    ? { name: N; type: R extends Array<any> ? R : (R extends object ? OmitDefaults<R> : R); modifiers: M }
    : never;
};

export type OmitIdentities<T> = {
    [K in keyof T as T[K] extends { modifiers: infer M }
    ? "identity" extends M
    ? never
    : K
    : K]: T[K] extends { type: infer R; name: infer N; modifiers: infer M }
    ? { name: N; type: R extends Array<any> ? R : (R extends object ? OmitIdentities<R> : R); modifiers: M }
    : never;
};


export type NonNullEntity<T extends {}> = NonNullable<InferType<SchemaDefinition<T>>>;

export type CompiledSchema<TEntity extends {}> = {
    key: number,
    tableName: string;
    properties: Map<string, ExpandedProperty>;
    getIds: (entity: NonNullEntity<TEntity>) => [IdType];
    enrich: (entity: NonNullEntity<TEntity>) => NonNullEntity<TEntity>;
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