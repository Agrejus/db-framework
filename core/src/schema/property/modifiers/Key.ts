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

    // will required a double save
    // first save with known id, save entity, then remove known id in favor of generated id and save again
    identity() {
        return new SchemaIdentity<T, TModifiers | "identity">(this);
    }

    default(value: DefaultValue<T>) {
        return new SchemaDefault<T, TModifiers | "default">(value, this);
    }
}