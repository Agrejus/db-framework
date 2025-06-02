import { SchemaModifiers, SchemaTypes } from "..";
import { SchemaBase } from "../property/base/Base";

export class SchemaFunction<T extends any, I, TModifiers extends SchemaModifiers = "unmapped"> extends SchemaBase<() => T, TModifiers> {
    instance: () => T;
    type = SchemaTypes.Function;
    private _schemaFunction = true;

    constructor(fn: (injected: I) => T, injected: I, current?: SchemaBase<() => T, TModifiers>) {
        super(current);
        this.injected = injected;
        this.isUnmapped = true;
        this.functionBody = fn as any;
    }
}