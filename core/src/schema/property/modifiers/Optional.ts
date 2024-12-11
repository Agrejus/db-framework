import { SchemaModifiers } from "../..";
import { SchemaBase } from "../base/Base";
import { SchemaNullable } from "./Nullable";

export class SchemaOptional<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    private _schemaOptional = true;

    constructor(current: SchemaBase<T, TModifiers>) {
        super(current);
        this.instance = current.instance;
        this.isOptional = true;
    }

    nullable() {
        return new SchemaNullable<T, TModifiers | "nullable">(this);
    }
}