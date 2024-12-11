import { PropertyDeserializer, PropertySerializer, SchemaModifiers } from "../..";
import { SchemaBase } from "../base/Base";
import { SchemaDeserialize } from "./Deserialize";

export class SchemaSerialize<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {
    instance: T;
    private _schemaSerialize = true;

    constructor(serializer: PropertySerializer<T>, current: SchemaBase<T, TModifiers>) {
        super(current);
        this.instance = current.instance;
        this.valueSerializer = serializer;
    }

    deserializer(deserializer: PropertyDeserializer<T>) {
        return new SchemaDeserialize<T, TModifiers | "deserialize">(deserializer, this);
    }
}