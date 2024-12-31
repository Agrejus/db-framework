import { PropertyDeserializer, PropertySerializer, SchemaModifiers, SchemaTypes } from "../..";
import { SchemaBase } from "../base/Base";
import { SchemaDefault } from "../modifiers/Default";
import { SchemaNullable } from "../modifiers/Nullable";
import { SchemaOptional } from "../modifiers/Optional";
import { SchemaDeserialize } from '../modifiers/Deserialize';
import { SchemaSerialize } from '../modifiers/Serialize';
import { DefaultValue } from "../../../types";

export class SchemaArray<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T[], TModifiers> {

    instance: T[];
    type = SchemaTypes.Array;
    private _schemaArray = true;

    optional() {
        return new SchemaOptional<T[], TModifiers | "optional">(this);
    }

    nullable() {
        return new SchemaNullable<T[], TModifiers | "nullable">(this);
    }

    default<I = never>(value: DefaultValue<T[], I>, injected?: I) {
        return new SchemaDefault<T[], I, TModifiers | "default">(value, injected, this);
    }

    deserialize(deserializer: PropertyDeserializer<T[]>) {
        return new SchemaDeserialize<T[], TModifiers | "deserialize">(deserializer, this);
    }

    serialize(serializer: PropertySerializer<T[]>) {
        return new SchemaSerialize<T[], TModifiers | "serialize">(serializer, this);
    }
}