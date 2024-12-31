import { PropertyDeserializer, PropertySerializer, SchemaModifiers } from "../..";
import { DefaultValue } from "../../../types";
import { SchemaBase } from "../base/Base";
import { SchemaDeserialize } from "./Deserialize";
import { SchemaSerialize } from "./Serialize";

export class SchemaDefault<T extends any, I, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {
    instance: T;
    private _schemaDefault = true;

    constructor(defaultValue: DefaultValue<T, I>, injected: I, current: SchemaBase<T, TModifiers>) {
        super(current);
        this.instance = current.instance;
        this.injected = injected;
        this.defaultValue = defaultValue;
    }

    serialize(serializer: PropertySerializer<T>) {
        return new SchemaSerialize<T, TModifiers | "serialize">(serializer, this);
    }

    deserialize(deserializer: PropertyDeserializer<T>) {
        return new SchemaDeserialize<T, TModifiers | "deserialize">(deserializer, this);
    }
}