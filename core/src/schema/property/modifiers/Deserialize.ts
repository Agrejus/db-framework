import { PropertyDeserializer, PropertySerializer, SchemaModifiers } from "../..";
import { SchemaBase } from "../base/Base";
import { SchemaSerialize } from "./Serialize";

export class SchemaDeserialize<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {
    instance: T;
    private _schemaDeserialize = true;

    constructor(deserializer: PropertyDeserializer<T>, current: SchemaBase<T, TModifiers>) {
        super(current);
        this.instance = current.instance;
        this.valueDeserializer = deserializer;
    }

    serialize(serializer: PropertySerializer<T>) {
        return new SchemaSerialize<T, TModifiers | "serialize">(serializer, this);
    }
}