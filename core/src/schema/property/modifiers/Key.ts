import { SchemaBase } from "../base/Base";
import { SchemaIdentity } from "./Identity";
import { SchemaModifiers } from "../..";
import { SchemaDefault } from "./Default";
import { IdType } from "../../..";
import { DefaultValue } from "../../../types";

export class SchemaKey<T extends IdType, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {
    instance: T;
    private _schemaKey = true;

    constructor(current: SchemaBase<T, TModifiers>) {
        super(current);
        this.instance = current.instance;
        this.isKey = true;
    }

    identity() {
        return new SchemaIdentity<T, TModifiers | "identity">(this);
    }

    default<I = never>(value: DefaultValue<T, I>, injected?: I) {
        return new SchemaDefault<T, I, TModifiers | "default">(value, injected, this);
    }
}