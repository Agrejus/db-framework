import { PropertyDeserializer, PropertySerializer, SchemaIdentity, SchemaModifiers, SchemaTypes } from "../..";
import { DefaultValue } from "../../../types";
import { SchemaBase } from "../base/Base";
import { SchemaDefault } from "../modifiers/Default";
import { SchemaDeserialize } from "../modifiers/Deserialize";
import { SchemaKey } from "../modifiers/Key";
import { SchemaNullable } from "../modifiers/Nullable";
import { SchemaOptional } from "../modifiers/Optional";
import { SchemaReadonly } from "../modifiers/Readonly";
import { SchemaSerialize } from "../modifiers/Serialize";

export class SchemaString<T extends string, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    type = SchemaTypes.String;
    private _schemaString = true;

    optional() {
        return new SchemaOptional<T, TModifiers | "optional">(this);
    }

    nullable() {
        return new SchemaNullable<T, TModifiers | "nullable">(this);
    }

    key() {
        return new SchemaKey<T, TModifiers | "key">(this);
    }

    default(value: DefaultValue<T>) {
        return new SchemaDefault<T, TModifiers | "default">(value, this);
    }

    readonly() {
        return new SchemaReadonly<T, TModifiers | "readonly">(this);
    }

    deserialize(deserializer: PropertyDeserializer<T>) {
        return new SchemaDeserialize<T, TModifiers | "deserialize">(deserializer, this);
    }

    serialize(serializer: PropertySerializer<T>) {
        return new SchemaSerialize<T, TModifiers | "serialize">(serializer, this);
    }

    identity() {
        return new SchemaIdentity<T, TModifiers | "identity">(this);
    }
}