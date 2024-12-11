import { SchemaModifiers, SchemaTypes } from "..";
import { SchemaBase } from "../property/base/Base";

export class SchemaFunction<T extends any, TModifiers extends SchemaModifiers = "unmapped"> extends SchemaBase<() => T, TModifiers> {
    instance: () => T;
    type = SchemaTypes.Function;
    private _schemaFunction = true;

    constructor(fn: () => T, current: SchemaBase<() => T, TModifiers>) {
        super(current);
        this.isUnmapped = true;
        this.functionBody = fn as any;
    }
}