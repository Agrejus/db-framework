import { PropertyDeserializer, PropertySerializer, SchemaModifiers } from "../..";
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

    default(value: T) {
        return new SchemaDefault<T, TModifiers | "default">(value, this);
    }

    deserializer(deserializer: PropertyDeserializer<T>) {
        return new SchemaDeserialize<T, TModifiers | "deserialize">(deserializer, this);
    }

    serializer(serializer: PropertySerializer<T>) {
        return new SchemaSerialize<T, TModifiers | "deserialize">(serializer, this);
    }
}