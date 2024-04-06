import { SchemaTypes } from "..";

export abstract class SchemaBase<T extends any> {
    instance?: T;
    isNullable: boolean = false;
    isOptional: boolean = false;
    isId: boolean = false;
    type: SchemaTypes
}
