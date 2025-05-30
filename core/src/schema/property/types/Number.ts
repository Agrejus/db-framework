import { PropertyDeserializer, PropertySerializer, SchemaArray, SchemaIdentity, SchemaModifiers, SchemaTypes } from "../..";
import { DefaultValue } from "../../../types";
import { uuidv4 } from "../../../utilities/uuid";
import { SchemaBase } from "../base/Base";
import { SchemaDefault } from "../modifiers/Default";
import { SchemaDeserialize } from "../modifiers/Deserialize";
import { SchemaDistinct } from "../modifiers/Distinct";
import { SchemaIndex } from "../modifiers/Index";
import { SchemaKey } from "../modifiers/Key";
import { SchemaNullable } from "../modifiers/Nullable";
import { SchemaOptional } from "../modifiers/Optional";
import { SchemaReadonly } from "../modifiers/Readonly";
import { SchemaSerialize } from "../modifiers/Serialize";

export class SchemaNumber<T extends number, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    type = SchemaTypes.Number;
    private _schemaNumber = true;

    optional() {
        return new SchemaOptional<T, TModifiers | "optional">(this);
    }

    nullable() {
        return new SchemaNullable<T, TModifiers | "nullable">(this);
    }

    key() {
        return new SchemaKey<T, TModifiers | "key" | "readonly">(this);
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

    identity() {
        return new SchemaIdentity<T, TModifiers | "identity">(this);
    }

    array() {
        return new SchemaArray<typeof this, TModifiers>(this as any);
    }

    index(...indexes: string[]) {
        return new SchemaIndex<T, TModifiers>(this as any, ...indexes);
    }

    distinct() {
        return new SchemaDistinct<T, TModifiers | "distinct">(this);
    }
}