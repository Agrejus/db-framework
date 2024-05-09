import { SchemaArray } from "./types/Array";
import { SchemaBase } from "./types/Base";
import { SchemaBoolean } from "./types/Boolean";
import { SchemaDate } from "./types/Date";
import { SchemaDefinition } from "./types/Definition";
import { SchemaNumber } from "./types/Number";
import { SchemaObject } from "./types/Object";
import { SchemaString } from "./types/String";

export { SchemaArray } from "./types/Array";
export { SchemaBoolean } from "./types/Boolean";
export { SchemaDate } from "./types/Date";
export { SchemaNumber } from "./types/Number";
export { SchemaObject } from "./types/Object";
export { SchemaString } from "./types/String";
export { SchemaDefinition } from "./types/Definition";
export { SchemaBase } from "./types/Base";

export enum SchemaTypes {
    Array = "Array",
    Boolean = "Boolean",
    Date = "Date",
    Number = "Number",
    Object = "Object",
    String = "String",
    Definition = "Definition"
}

export type SchemaBaseCheck<T> = T extends SchemaBase<any> ? InferType<T["instance"]> : ReturnIfObject<T, DeepSchemaCheck<T>>;
export type NestedSchemaCheck<T> = T extends SchemaBase<any> ? DeepSchemaCheck<T["instance"]> : T;
export type ReturnIfNotDate<T, R> = T extends Date ? T : R
export type ReturnIfObject<T, R> = T extends object ? R : T
export type DeepSchemaCheck<T> = ReturnIfNotDate<T, ReturnIfObject<T, { [P in keyof T]: NestedSchemaCheck<T[P]> }>>;
export type InferType<T extends SchemaBase<any>> = { [P in keyof T]: SchemaBaseCheck<T[P]>; }["instance"];

export const s = {
    number: <T extends number = number>(options?: { isId?: boolean; isAutoGenerated?: boolean }) => new SchemaNumber<T>(options),
    string: <T extends string = string>(options?: { isId?: boolean; isAutoGenerated?: boolean }) => new SchemaString<T>(options),
    boolean: <T extends boolean = boolean>() => new SchemaBoolean<T>(),
    date: <T extends Date = Date>() => new SchemaDate<T>(),
    array: <T extends any>(schema?: T) => new SchemaArray<T>(schema),
    object: <T extends {} = {}>(schema: T) => new SchemaObject<T>(schema),
    define: <TDocumentType extends string, T extends {}>(documentType: TDocumentType, schema: T) => new SchemaDefinition<TDocumentType, T & { DocumentType: SchemaString<TDocumentType> }>(documentType, { ...schema, DocumentType: s.string<TDocumentType>() })
}

export type ExpandedProperty = ExpandedChildProperty & {
    assignmentPath: string;
    selectorPath: string;
    properties: Map<string, ExpandedChildProperty>;
    childDegree: number;
    isAutoGenerated: boolean;
};

export type ExpandedChildProperty = {
    propertyName: string;
    type: SchemaTypes;
    isNullableOrOptional: boolean;
}

export type ExpandedSchema = {
    properties: Map<string, ExpandedProperty>;
    idPropertyName: string;
    autoGeneratedSetter: (entity: any, dbrecord: any) => any
}