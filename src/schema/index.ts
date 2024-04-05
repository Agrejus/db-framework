import { SchemaArray } from "./types/Array";
import { SchemaBase } from "./types/Base";
import { SchemaBoolean } from "./types/Boolean";
import { SchemaDate } from "./types/Date";
import { SchemaNumber } from "./types/Number";
import { SchemaObject } from "./types/Object";
import { SchemaString } from "./types/String";

export { SchemaArray } from "./types/Array";
export { SchemaBoolean } from "./types/Boolean";
export { SchemaDate } from "./types/Date";
export { SchemaNumber } from "./types/Number";
export { SchemaObject } from "./types/Object";
export { SchemaString } from "./types/String";

export enum SchemaTypes {
    Array = "Array",
    Boolean = "Boolean",
    Date = "Date",
    Number = "Number",
    Object = "Object",
    String = "String"
}

export type SchemaBaseCheck<T> = T extends SchemaBase<any> ? InferType<T["instance"]> : ReturnIfObject<T, DeepSchemaCheck<T>>;
export type NestedSchemaCheck<T> = T extends SchemaBase<any> ? DeepSchemaCheck<T["instance"]> : T;
export type ReturnIfNotDate<T, R> = T extends Date ? T : R
export type ReturnIfObject<T, R> = T extends object ? R : T
export type DeepSchemaCheck<T> = ReturnIfNotDate<T, ReturnIfObject<T, { [P in keyof T]: NestedSchemaCheck<T[P]> }>>;
export type InferType<T extends SchemaBase<any>> = { [P in keyof T]: SchemaBaseCheck<T[P]>; }["instance"];


export const s = {
    number: <T extends number = number>() => new SchemaNumber<T>(),
    string: <T extends string = string>() => new SchemaString<T>(),
    boolean: <T extends boolean = boolean>() => new SchemaBoolean<T>(),
    date: <T extends Date = Date>() => new SchemaDate<T>(),
    array: <T extends any>(schema?: T) => new SchemaArray<T>(schema),
    object: <T extends {} = {}>(schema: T) => new SchemaObject<T>(schema),
}
