import { PropertyDeserializer, PropertySerializer, SchemaModifiers } from "../..";
import { DefaultValue } from "../../../types";
import { SchemaBase } from "../base/Base";
import { SchemaDefault } from "./Default";
import { SchemaDeserialize } from "./Deserialize";
import { SchemaSerialize } from "./Serialize";

export class SchemaReadonly<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    private _schemaReadonly = true;

    constructor(current: SchemaBase<T, TModifiers>) {
        super(current);
        this.instance = current.instance;
        this.isReadonly = true;
    }

    default<I = never>(value: DefaultValue<T, I>, injected?: I) {
        return new SchemaDefault<T, I, TModifiers | "default">(value, injected, this);
    }

    deserializer(deserializer: PropertyDeserializer<T>) {
        return new SchemaDeserialize<T, TModifiers | "deserialize">(deserializer, this);
    }

    serializer(serializer: PropertySerializer<T>) {
        return new SchemaSerialize<T, TModifiers | "deserialize">(serializer, this);
    }
}