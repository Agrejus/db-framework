import { PropertyDeserializer, PropertySerializer, SchemaModifiers, SchemaReadonly } from "../..";
import { DefaultValue } from "../../../types";
import { uuidv4 } from "../../../utilities/uuid";
import { SchemaBase } from "../base/Base";
import { SchemaDefault } from "./Default";
import { SchemaDeserialize } from "./Deserialize";
import { SchemaDistinct } from "./Distinct";
import { SchemaNullable } from "./Nullable";
import { SchemaOptional } from "./Optional";
import { SchemaSerialize } from "./Serialize";

export class SchemaIndex<T extends any, TModifiers extends SchemaModifiers> extends SchemaBase<T, TModifiers> {

    instance: T;
    private _schemaIndex = true;

    constructor(current: SchemaBase<T, TModifiers>, ...indexes: string[]) {
        super(current);
        this.instance = current.instance;

        if (indexes.length === 0) {
            indexes.push(uuidv4()); // Create our own unique index identifier
        }

        this.indexes = indexes;
    }

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

    distinct() {
        return new SchemaDistinct<T, TModifiers | "distinct">(this);
    }
}