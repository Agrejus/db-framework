import { SchemaModifiers } from "../..";
import { SchemaBase } from "../base/Base";

export class SchemaTracked<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    private _schemaTracked = true;

    constructor(current: SchemaBase<T, TModifiers>) {
        super(current);
        this.instance = current.instance;
        this.isUnmapped = false;
    }
}