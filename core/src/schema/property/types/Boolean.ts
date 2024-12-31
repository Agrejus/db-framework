import { PropertyDeserializer, PropertySerializer, SchemaModifiers, SchemaTypes } from "../..";
import { DefaultValue } from "../../../types";
import { SchemaBase } from "../base/Base";
import { SchemaDefault } from "../modifiers/Default";
import { SchemaDeserialize } from "../modifiers/Deserialize";
import { SchemaNullable } from "../modifiers/Nullable";
import { SchemaOptional } from "../modifiers/Optional";
import { SchemaReadonly } from "../modifiers/Readonly";
import { SchemaSerialize } from "../modifiers/Serialize";

export class SchemaBoolean<T extends boolean, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    type = SchemaTypes.Boolean;
    private _schemaBoolean = true;
    
    optional() {
        return new SchemaOptional<T, TModifiers | "optional">(this);
    }

    nullable() {
        return new SchemaNullable<T, TModifiers | "nullable">(this);
    }

    default<I = never>(value: DefaultValue<T, I>, injected?: I) {
        return new SchemaDefault<T, I, TModifiers | "default">(value, injected, this);
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
}